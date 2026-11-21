import { Prisma, PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export const ACTIVE_PRINT_JOB_STATUSES = [
  PrintJobStatus.PENDING,
  PrintJobStatus.PROCESSING,
];

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

export type StoredPrintJob = {
  jobId: string;
  type: PrintJobType;
  entityId: string | null;
  status: PrintJobStatus;
  createdAt: Date;
};

export type WorkerPrintJob = {
  jobId: string;
  type: PrintJobType;
  entityId: string | null;
  clinicId: string | null;
};

export type NewPrintJob = {
  type: PrintJobType;
  entityId: string;
  clinicId?: string | null;
  userId?: string | null;
  payload: Prisma.InputJsonValue;
};

const storedJobSelect = {
  jobId: true,
  type: true,
  entityId: true,
  status: true,
  createdAt: true,
} as const;

export class PrintJobRepository {
  constructor(private readonly db: Prisma.TransactionClient = prisma) {}

  public async findWithFile(jobId: string): Promise<PrintJobWithFile | null> {
    return await this.db.printJob.findUnique({
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

  public async findForWorker(jobId: string): Promise<WorkerPrintJob | null> {
    return await this.db.printJob.findUnique({
      where: { jobId },
      select: { jobId: true, type: true, entityId: true, clinicId: true },
    });
  }

  public async findActiveForEntity(
    type: PrintJobType,
    entityId: string,
  ): Promise<StoredPrintJob[]> {
    return await this.db.printJob.findMany({
      where: { type, entityId, status: { in: ACTIVE_PRINT_JOB_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: storedJobSelect,
    });
  }

  public async create(input: NewPrintJob): Promise<StoredPrintJob> {
    return await this.db.printJob.create({
      data: {
        type: input.type,
        status: PrintJobStatus.PENDING,
        entityId: input.entityId,
        clinicId: input.clinicId || null,
        userId: input.userId || null,
        payload: input.payload,
      },
      select: storedJobSelect,
    });
  }

  public async findRenderStartedAtForFile(fileId: string): Promise<Date | null> {
    const producer = await this.db.printJob.findFirst({
      where: { fileId, status: PrintJobStatus.DONE },
      orderBy: { finishedAt: "desc" },
      select: { startedAt: true },
    });
    return producer?.startedAt ?? null;
  }

  public async claim(jobId: string): Promise<boolean> {
    const { count } = await this.db.printJob.updateMany({
      where: { jobId, status: { in: ACTIVE_PRINT_JOB_STATUSES } },
      data: {
        status: PrintJobStatus.PROCESSING,
        startedAt: new Date(),
        errorMsg: null,
      },
    });
    return count > 0;
  }

  public async markDone(jobId: string, fileId: string | null): Promise<void> {
    await this.db.printJob.update({
      where: { jobId },
      data: {
        status: PrintJobStatus.DONE,
        fileId,
        finishedAt: new Date(),
        errorMsg: null,
      },
    });
  }

  public async markStatus(
    jobId: string,
    status: PrintJobStatus,
    errorMsg: string,
  ): Promise<void> {
    await this.db.printJob.update({
      where: { jobId },
      data: { status, errorMsg, finishedAt: new Date() },
    });
  }
}
