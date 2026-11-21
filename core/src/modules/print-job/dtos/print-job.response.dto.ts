import { PrintJobStatus, PrintJobType } from "@prisma/client";

export interface PrintJobStatusResponseDto {
  jobId: string;
  type: PrintJobType;
  status: PrintJobStatus;
  fileId: string | null;
  fileUrl: string | null;
  errorMsg: string | null;
  createdAt: Date;
  finishedAt: Date | null;
}
