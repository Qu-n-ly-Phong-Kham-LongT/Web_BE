import { BaseError } from "../../../utils/base-error.util";
import { resolveFileUrl } from "../../../utils/file-url.util";
import { PrintJobStatusResponseDto } from "../dtos/print-job.response.dto";
import { PrintJobRepository } from "../repositories/print-job.repository";

export class PrintJobService {
  constructor(
    private readonly printJobRepository: PrintJobRepository = new PrintJobRepository(),
  ) {}

  public async getJobStatus(
    jobId: string,
    clinicId: string | null | undefined,
  ): Promise<PrintJobStatusResponseDto> {
    const job = await this.printJobRepository.findWithFile(jobId);
    const belongsToClinic = !job?.clinicId || job.clinicId === clinicId;
    if (!job || !belongsToClinic) {
      throw new BaseError(404, "Print job not found");
    }

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      fileId: job.fileId,
      fileUrl: resolveFileUrl(job.file?.relativePath ?? null),
      errorMsg: job.errorMsg,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
    };
  }
}
