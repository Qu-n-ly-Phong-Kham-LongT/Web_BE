import amqp from "amqplib";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../config/database.config";
import { BaseError } from "./base-error.util";
import { SharedService } from "../modules/shared/services/shared.service";
import { PrecriptionService } from "../modules/prescriptions/services/prescription.service";
import { ServiceRequestService } from "../modules/service-request/services/service-request.service";
import { FileRepository } from "../modules/file/repositories/file.repository";
import {
  ensurePrintJobInfrastructure,
  getNumberEnv,
  QUEUE_DEAD,
  QUEUE_MAIN,
  QUEUE_RETRY,
} from "./print-job-queue.util";
import { emitToJob } from "./socket.util";

const DEFAULT_JOB_RETRY_MAX = 3;
const DEFAULT_PREFETCH = 1;

const sharedService = new SharedService();
const prescriptionService = new PrecriptionService();
const serviceRequestService = new ServiceRequestService();
const fileRepository = new FileRepository();

function shouldRetryJob(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 500;
  }
  return true;
}

function resolveFileUrl(relativePath?: string | null): string | null {
  if (!relativePath) return null;
  const base = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return relativePath;
  return `${base}${relativePath}`;
}

export async function runWorker() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await conn.createChannel();

  const retryMax = getNumberEnv(
    "RABBITMQ_JOB_RETRY_MAX",
    DEFAULT_JOB_RETRY_MAX,
  );
  const prefetch = getNumberEnv("CONVERT_MAX_CONCURRENCY", DEFAULT_PREFETCH);

  await ensurePrintJobInfrastructure(channel);

  channel.prefetch(prefetch);

  channel.consume(QUEUE_MAIN, async (msg) => {
    if (!msg) return;

    const headers = msg.properties?.headers ?? {};
    const currentRetry = Number(headers["x-retry"] ?? 0);
    let jobId = "";

    try {
      const payload = JSON.parse(msg.content.toString());
      jobId = String(payload?.jobId ?? "");
      if (!jobId) {
        throw new BaseError(400, "Missing jobId");
      }

      const job = await prisma.printJob.findUnique({ where: { jobId } });
      if (!job) {
        console.warn(`PrintJob not found: ${jobId}`);
        channel.ack(msg);
        return;
      }

      await prisma.printJob.update({
        where: { jobId },
        data: {
          status: PrintJobStatus.PROCESSING,
          startedAt: new Date(),
          errorMsg: null,
        },
      });
      emitToJob(jobId, "print.processing", {
        jobId,
        status: PrintJobStatus.PROCESSING,
      });

      let fileId: string | null = null;
      let fileUrl: string | null = null;

      switch (job.type) {
        case PrintJobType.MEDICAL_RECORD: {
          if (!job.entityId) {
            throw new BaseError(400, "Missing medical record id");
          }
          await sharedService.printMedicalRecordDocx(
            job.entityId,
            job.clinicId ?? "",
          );
          const file = await fileRepository.findByMedicalRecordId(
            job.entityId,
          );
          fileId = file?.fileID ?? null;
          fileUrl = resolveFileUrl(file?.relativePath ?? null);
          break;
        }
        case PrintJobType.PRESCRIPTION: {
          if (!job.entityId) {
            throw new BaseError(400, "Missing prescription id");
          }
          await prescriptionService.printPrescriptionPdf(
            job.entityId,
            job.clinicId ?? undefined,
          );
          const file = await fileRepository.findByPrescriptionId(
            job.entityId,
          );
          fileId = file?.fileID ?? null;
          fileUrl = resolveFileUrl(file?.relativePath ?? null);
          break;
        }
        case PrintJobType.SERVICE_REQUEST: {
          if (!job.entityId) {
            throw new BaseError(400, "Missing service request id");
          }
          await serviceRequestService.printServiceRequestPdf(
            job.entityId,
            job.clinicId ?? undefined,
          );
          const file = await fileRepository.findByServiceRequestId(
            job.entityId,
          );
          fileId = file?.fileID ?? null;
          fileUrl = resolveFileUrl(file?.relativePath ?? null);
          break;
        }
        default:
          throw new BaseError(400, "Unsupported job type");
      }

      await prisma.printJob.update({
        where: { jobId },
        data: {
          status: PrintJobStatus.DONE,
          fileId: fileId,
          finishedAt: new Date(),
          errorMsg: null,
        },
      });

      console.log(`Job ${jobId} xong!`);
      emitToJob(jobId, "print.done", {
        jobId,
        status: PrintJobStatus.DONE,
        fileId,
        fileUrl,
      });
      channel.ack(msg);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      console.error("Lỗi Worker:", error);

      const retryable = shouldRetryJob(error) && currentRetry < retryMax;
      const nextStatus = retryable
        ? PrintJobStatus.PENDING
        : PrintJobStatus.FAILED;

      if (jobId) {
        await prisma.printJob.update({
          where: { jobId },
          data: {
            status: nextStatus,
            errorMsg,
            finishedAt: new Date(),
          },
        });
      }
      emitToJob(jobId, "print.failed", {
        jobId,
        status: nextStatus,
        errorMsg,
      });

      if (retryable) {
        channel.sendToQueue(QUEUE_RETRY, msg.content, {
          persistent: true,
          contentType: msg.properties.contentType,
          headers: { ...headers, "x-retry": currentRetry + 1 },
        });
        channel.ack(msg);
        return;
      }

      channel.sendToQueue(QUEUE_DEAD, msg.content, {
        persistent: true,
        contentType: msg.properties.contentType,
        headers: { ...headers, "x-retry": currentRetry },
      });
      channel.ack(msg);
    }
  });
}
