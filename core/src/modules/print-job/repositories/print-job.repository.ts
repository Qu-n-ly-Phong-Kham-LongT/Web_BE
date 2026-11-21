import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export type PrintJobWithFile = {
  jobId: string;
  type: PrintJobType;
  status: PrintJobStatus;
  clinicId: string | null;
  fileId: string | null;
  errorMsg: string | null;
  createdAt: Date;
  finishedAt: Date | null;
  file: { relativePath: string } | null;
};

export class PrintJobRepository {
  public async findWithFile(jobId: string): Promise<PrintJobWithFile | null> {
    return await prisma.printJob.findUnique({
      where: { jobId },
      select: {
        jobId: true,
        type: true,
        status: true,
        clinicId: true,
        fileId: true,
        errorMsg: true,
        createdAt: true,
        finishedAt: true,
        file: { select: { relativePath: true } },
      },
    });
  }
}
