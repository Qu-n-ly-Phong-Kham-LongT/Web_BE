import { Channel, ConsumeMessage } from "amqplib";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { BaseError } from "./base-error.util";
import { QUEUE_DEAD, QUEUE_MAIN, QUEUE_RETRY } from "./print-job-queue.util";
import { WORKER_PREFIX, type PrintMessageHandler } from "./print-worker.util";

export const PRINT_JOB_FAILED_MESSAGE = "Print job failed";

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

export type ClaimOutcome = "claimed" | "finished" | "busy" | "missing";

export type PrintJobHandlerDeps = {
  retryMax: number;
  findJob: (jobId: string) => Promise<PrintJobRecord | null>;
  claimJob: (job: PrintJobRecord) => Promise<ClaimOutcome>;
  generateFile: (job: PrintJobRecord) => Promise<GeneratedPrintFile>;
  markDone: (jobId: string, file: GeneratedPrintFile) => Promise<boolean>;
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

function toUserReason(error: unknown): string {
  if (error instanceof BaseError && error.statusCode < 500) {
    return error.message;
  }
  return PRINT_JOB_FAILED_MESSAGE;
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

function moveMessage(
  channel: Channel,
  msg: ConsumeMessage,
  jobId: string,
  targetQueue: string,
  retry: number,
): void {
  const headers = msg.properties?.headers ?? {};
  try {
    channel.sendToQueue(targetQueue, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType,
      headers: { ...headers, "x-retry": retry },
    });
    channel.ack(msg);
    console.warn(
      `${WORKER_PREFIX} moved: from=${QUEUE_MAIN} to=${targetQueue} jobId=${jobId || "unknown"} retry=${retry}`,
    );
  } catch (error) {
    console.error(
      `${WORKER_PREFIX} could not move message, broker will redeliver: jobId=${jobId || "unknown"}`,
      error,
    );
  }
}

async function processJob(
  deps: PrintJobHandlerDeps,
  channel: Channel,
  msg: ConsumeMessage,
  jobId: string,
  currentRetry: number,
): Promise<void> {
  try {
    const job = await deps.findJob(jobId);
    const outcome = job ? await deps.claimJob(job) : "missing";
    if (!job || outcome === "missing" || outcome === "finished") {
      console.warn(`${WORKER_PREFIX} job ${outcome}: jobId=${jobId}, ack and skip`);
      tryAck(channel, msg, jobId);
      return;
    }
    if (outcome === "busy") {
      console.log(
        `${WORKER_PREFIX} document busy, postponing: jobId=${jobId} entityId=${job.entityId ?? "null"}`,
      );
      moveMessage(channel, msg, jobId, QUEUE_RETRY, currentRetry);
      return;
    }

    deps.emit(jobId, "print.processing", {
      jobId,
      status: PrintJobStatus.PROCESSING,
    });
    console.log(
      `${WORKER_PREFIX} processing: jobId=${jobId} type=${job.type} entityId=${job.entityId ?? "null"}`,
    );

    const file = await deps.generateFile(job);
    const recorded = await deps.markDone(jobId, file);
    console.log(
      `${WORKER_PREFIX} done: jobId=${jobId} fileId=${file.fileId ?? "null"} recorded=${recorded}`,
    );
    deps.emit(jobId, "print.done", {
      jobId,
      status: PrintJobStatus.DONE,
      fileId: file.fileId,
      fileUrl: file.fileUrl,
    });
  } catch (error) {
    console.error(
      `${WORKER_PREFIX} failed: queue=${QUEUE_MAIN} jobId=${jobId} retry=${currentRetry}/${deps.retryMax}`,
      error,
    );

    const retryable = shouldRetryJob(error) && currentRetry < deps.retryMax;
    const nextStatus = retryable ? PrintJobStatus.PENDING : PrintJobStatus.FAILED;
    const nextRetry = retryable ? currentRetry + 1 : currentRetry;
    const reason = toUserReason(error);

    moveMessage(channel, msg, jobId, retryable ? QUEUE_RETRY : QUEUE_DEAD, nextRetry);

    try {
      await deps.markFailure(jobId, nextStatus, reason);
    } catch (updateError) {
      console.error(
        `${WORKER_PREFIX} could not record failure: jobId=${jobId}`,
        updateError,
      );
    }
    deps.emit(jobId, retryable ? "print.retrying" : "print.failed", {
      jobId,
      status: nextStatus,
      errorMsg: reason,
      retry: nextRetry,
    });
    return;
  }

  tryAck(channel, msg, jobId);
}

export function createPrintJobHandler(
  deps: PrintJobHandlerDeps,
): PrintMessageHandler {
  const inFlight = new Map<string, Promise<void>>();

  return async (channel, msg) => {
    const currentRetry = Number(msg.properties?.headers?.["x-retry"] ?? 0);
    let jobId: string;
    try {
      jobId = parseJobId(msg);
    } catch (error) {
      console.error(`${WORKER_PREFIX} unreadable message, dead-lettering`, error);
      moveMessage(channel, msg, "", QUEUE_DEAD, currentRetry);
      return;
    }
    console.log(
      `${WORKER_PREFIX} received: queue=${QUEUE_MAIN} jobId=${jobId} retry=${currentRetry}/${deps.retryMax}`,
    );

    const running = inFlight.get(jobId);
    if (running) {
      console.warn(
        `${WORKER_PREFIX} redelivered while running: jobId=${jobId}, waiting for current run`,
      );
      await running;
      tryAck(channel, msg, jobId);
      return;
    }

    const run = processJob(deps, channel, msg, jobId, currentRetry);
    inFlight.set(jobId, run);
    try {
      await run;
    } finally {
      inFlight.delete(jobId);
    }
  };
}
