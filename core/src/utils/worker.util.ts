import { PrintJobType } from "@prisma/client";
import { BaseError } from "./base-error.util";
import { PrintJobRepository } from "../modules/print-job/repositories/print-job.repository";
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
import {
  PrintWorkerHandle,
  startPrintWorker,
  WORKER_PREFIX,
} from "./print-worker.util";

const DEFAULT_JOB_RETRY_MAX = 3;
const DEFAULT_PREFETCH = 1;

const sharedService = new SharedService();
const prescriptionService = new PrecriptionService();
const serviceRequestService = new ServiceRequestService();
const fileRepository = new FileRepository();
const printJobRepository = new PrintJobRepository();

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
    findJob: (jobId) => printJobRepository.findForWorker(jobId),
    claimJob: (jobId) => printJobRepository.claim(jobId),
    generateFile: generatePrintFile,
    markDone: (jobId, file) => printJobRepository.markDone(jobId, file.fileId),
    markFailure: (jobId, status, errorMsg) =>
      printJobRepository.markStatus(jobId, status, errorMsg),
    emit: emitToJob,
  };
}

export function runWorker(): PrintWorkerHandle {
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) {
    throw new Error("RABBITMQ_URL is not configured");
  }

  const deps = buildPrintJobHandlerDeps();
  console.log(`${WORKER_PREFIX} retryMax=${deps.retryMax}`);

  return startPrintWorker({
    url: rabbitUrl,
    prefetch: getNumberEnv("CONVERT_MAX_CONCURRENCY", DEFAULT_PREFETCH),
    handleMessage: createPrintJobHandler(deps),
  });
}
