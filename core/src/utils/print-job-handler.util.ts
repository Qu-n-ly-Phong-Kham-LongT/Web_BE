import { Channel, ConsumeMessage } from "amqplib";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { BaseError } from "./base-error.util";
import { QUEUE_DEAD, QUEUE_MAIN, QUEUE_RETRY } from "./print-job-queue.util";
import type { PrintMessageHandler } from "./print-worker.util";

const WORKER_PREFIX = "[rabbitmq][worker]";

export type PrintJobRecord = {
  jobId: string;
  type: PrintJobType;
  entityId: string | null;
  clinicId: string | null;
};

export type GeneratedPrintFile = {
  fileId: string | null;
  fileUrl: string | null;
};

export type PrintJobHandlerDeps = {
  retryMax: number;
  findJob: (jobId: string) => Promise<PrintJobRecord | null>;
  markProcessing: (jobId: string) => Promise<void>;
  generateFile: (job: PrintJobRecord) => Promise<GeneratedPrintFile>;
  markDone: (jobId: string, file: GeneratedPrintFile) => Promise<void>;
  markFailure: (
    jobId: string,
    status: PrintJobStatus,
    errorMsg: string,
  ) => Promise<void>;
  emit: (jobId: string, event: string, data: unknown) => void;
};

export function shouldRetryJob(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 500;
  }
  return true;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
}

function parseJobId(msg: ConsumeMessage): string {
  const payload = JSON.parse(msg.content.toString());
  const jobId = String(payload?.jobId ?? "");
  if (!jobId) {
    throw new BaseError(400, "Missing jobId");
  }
  return jobId;
}

function tryAck(channel: Channel, msg: ConsumeMessage, jobId: string): void {
  try {
    channel.ack(msg);
    console.log(`${WORKER_PREFIX} ack: queue=${QUEUE_MAIN} jobId=${jobId}`);
  } catch (error) {
    console.error(
      `${WORKER_PREFIX} ack failed, broker will redeliver: jobId=${jobId}`,
      error,
    );
  }
}

function requeueOrDeadLetter(
  channel: Channel,
  msg: ConsumeMessage,
  jobId: string,
  retryable: boolean,
  currentRetry: number,
): void {
  const headers = msg.properties?.headers ?? {};
  const targetQueue = retryable ? QUEUE_RETRY : QUEUE_DEAD;
  const nextRetry = retryable ? currentRetry + 1 : currentRetry;
  try {
    channel.sendToQueue(targetQueue, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType,
      headers: { ...headers, "x-retry": nextRetry },
    });
    channel.ack(msg);
    console.warn(
      `${WORKER_PREFIX} moved: from=${QUEUE_MAIN} to=${targetQueue} jobId=${jobId || "unknown"} retry=${nextRetry}`,
    );
  } catch (error) {
    console.error(
      `${WORKER_PREFIX} could not move message, broker will redeliver: jobId=${jobId || "unknown"}`,
      error,
    );
  }
}

export function createPrintJobHandler(
  deps: PrintJobHandlerDeps,
): PrintMessageHandler {
  return async (channel, msg) => {
    const currentRetry = Number(msg.properties?.headers?.["x-retry"] ?? 0);
    let jobId = "";

    try {
      jobId = parseJobId(msg);
      console.log(
        `${WORKER_PREFIX} received: queue=${QUEUE_MAIN} jobId=${jobId} retry=${currentRetry}/${deps.retryMax}`,
      );

      const job = await deps.findJob(jobId);
      if (!job) {
        console.warn(`${WORKER_PREFIX} job not found: jobId=${jobId}, ack and skip`);
        tryAck(channel, msg, jobId);
        return;
      }

      await deps.markProcessing(jobId);
      deps.emit(jobId, "print.processing", {
        jobId,
        status: PrintJobStatus.PROCESSING,
      });
      console.log(
        `${WORKER_PREFIX} processing: jobId=${jobId} type=${job.type} entityId=${job.entityId ?? "null"}`,
      );

      const file = await deps.generateFile(job);
      await deps.markDone(jobId, file);
      console.log(
        `${WORKER_PREFIX} done: jobId=${jobId} fileId=${file.fileId ?? "null"} fileUrl=${file.fileUrl ?? "null"}`,
      );
      deps.emit(jobId, "print.done", {
        jobId,
        status: PrintJobStatus.DONE,
        fileId: file.fileId,
        fileUrl: file.fileUrl,
      });
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      console.error(
        `${WORKER_PREFIX} failed: queue=${QUEUE_MAIN} jobId=${jobId || "unknown"} retry=${currentRetry}/${deps.retryMax}`,
        error,
      );

      const retryable = shouldRetryJob(error) && currentRetry < deps.retryMax;
      const nextStatus = retryable
        ? PrintJobStatus.PENDING
        : PrintJobStatus.FAILED;

      requeueOrDeadLetter(channel, msg, jobId, retryable, currentRetry);

      if (jobId) {
        try {
          await deps.markFailure(jobId, nextStatus, errorMsg);
        } catch (updateError) {
          console.error(
            `${WORKER_PREFIX} could not record failure: jobId=${jobId}`,
            updateError,
          );
        }
      }
      deps.emit(jobId, retryable ? "print.retrying" : "print.failed", {
        jobId,
        status: nextStatus,
        errorMsg,
        retry: retryable ? currentRetry + 1 : currentRetry,
      });
      return;
    }

    tryAck(channel, msg, jobId);
  };
}
