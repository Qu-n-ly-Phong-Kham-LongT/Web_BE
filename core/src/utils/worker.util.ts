import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../config/database.config";
import { BaseError } from "./base-error.util";
import { SharedService } from "../modules/shared/services/shared.service";
import { PrecriptionService } from "../modules/prescriptions/services/prescription.service";
import { ServiceRequestService } from "../modules/service-request/services/service-request.service";
import { FileRepository } from "../modules/file/repositories/file.repository";
import { getNumberEnv } from "./print-job-queue.util";
import { emitToJob } from "./socket.util";
import { resolveFileUrl } from "./file-url.util";
import {
  createPrintJobHandler,
  GeneratedPrintFile,
  PrintJobHandlerDeps,
  PrintJobRecord,
} from "./print-job-handler.util";
import { PrintWorkerHandle, startPrintWorker } from "./print-worker.util";

const DEFAULT_JOB_RETRY_MAX = 3;
const DEFAULT_PREFETCH = 1;

const sharedService = new SharedService();
const prescriptionService = new PrecriptionService();
const serviceRequestService = new ServiceRequestService();
const fileRepository = new FileRepository();

function toGeneratedFile(
  file: { fileID: string; relativePath: string } | null,
): GeneratedPrintFile {
  return {
    fileId: file?.fileID ?? null,
    fileUrl: resolveFileUrl(file?.relativePath ?? null),
  };
}

async function generatePrintFile(
  job: PrintJobRecord,
): Promise<GeneratedPrintFile> {
  if (!job.entityId) {
    throw new BaseError(400, `Missing entity id for ${job.type} print job`);
  }

  switch (job.type) {
    case PrintJobType.MEDICAL_RECORD:
      await sharedService.printMedicalRecordDocx(job.entityId, job.clinicId ?? "");
      return toGeneratedFile(
        await fileRepository.findByMedicalRecordId(job.entityId),
      );
    case PrintJobType.PRESCRIPTION:
      await prescriptionService.printPrescriptionPdf(
        job.entityId,
        job.clinicId ?? undefined,
      );
      return toGeneratedFile(
        await fileRepository.findByPrescriptionId(job.entityId),
      );
    case PrintJobType.SERVICE_REQUEST:
      await serviceRequestService.printServiceRequestPdf(
        job.entityId,
        job.clinicId ?? undefined,
      );
      return toGeneratedFile(
        await fileRepository.findByServiceRequestId(job.entityId),
      );
    default:
      throw new BaseError(400, "Unsupported job type");
  }
}

export function buildPrintJobHandlerDeps(): PrintJobHandlerDeps {
  return {
    retryMax: getNumberEnv("RABBITMQ_JOB_RETRY_MAX", DEFAULT_JOB_RETRY_MAX),
    findJob: (jobId) =>
      prisma.printJob.findUnique({
        where: { jobId },
        select: { jobId: true, type: true, entityId: true, clinicId: true },
      }),
    markProcessing: async (jobId) => {
      await prisma.printJob.update({
        where: { jobId },
        data: {
          status: PrintJobStatus.PROCESSING,
          startedAt: new Date(),
          errorMsg: null,
        },
      });
    },
    generateFile: generatePrintFile,
    markDone: async (jobId, file) => {
      await prisma.printJob.update({
        where: { jobId },
        data: {
          status: PrintJobStatus.DONE,
          fileId: file.fileId,
          finishedAt: new Date(),
          errorMsg: null,
        },
      });
    },
    markFailure: async (jobId, status, errorMsg) => {
      await prisma.printJob.update({
        where: { jobId },
        data: { status, errorMsg, finishedAt: new Date() },
      });
    },
    emit: emitToJob,
  };
}

export function runWorker(): PrintWorkerHandle {
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) {
    throw new Error("RABBITMQ_URL is not configured");
  }

  const deps = buildPrintJobHandlerDeps();
  console.log(`[rabbitmq][worker] retryMax=${deps.retryMax}`);

  return startPrintWorker({
    url: rabbitUrl,
    prefetch: getNumberEnv("CONVERT_MAX_CONCURRENCY", DEFAULT_PREFETCH),
    handleMessage: createPrintJobHandler(deps),
  });
}
