import { Prisma, PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export const ACTIVE_PRINT_JOB_STATUSES: PrintJobStatus[] = [
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
  startedAt: Date | null;
};

export type WorkerPrintJob = {
  jobId: string;
  type: PrintJobType;
  entityId: string | null;
  clinicId: string | null;
};

export type ClaimResult = "claimed" | "finished" | "busy" | "missing";

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
  startedAt: true,
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

  public async lockEntity(type: PrintJobType, entityId: string): Promise<void> {
    const lockKey = `print-job:${type}:${entityId}`;
    await this.db.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(${lockKey}))) AS locked`;
  }

  public async findLatestRenderStartedAt(
    type: PrintJobType,
    entityId: string,
  ): Promise<Date | null> {
    const latest = await this.db.printJob.findFirst({
      where: { type, entityId, status: PrintJobStatus.DONE },
      orderBy: { finishedAt: "desc" },
      select: { startedAt: true },
    });
    return latest?.startedAt ?? null;
  }

  public async claimLocked(
    jobId: string,
    type: PrintJobType,
    entityId: string,
    staleBefore: Date,
    abandonedMessage: string,
  ): Promise<ClaimResult> {
    const current = await this.db.printJob.findUnique({
      where: { jobId },
      select: { status: true, createdAt: true },
    });
    if (!current) return "missing";
    if (!ACTIVE_PRINT_JOB_STATUSES.includes(current.status)) return "finished";
    if (current.status === PrintJobStatus.PENDING && current.createdAt < staleBefore) {
      await this.abandonIfStale(jobId, staleBefore, abandonedMessage);
      return "finished";
    }
    const sibling = await this.db.printJob.findFirst({
      where: {
        type,
        entityId,
        status: PrintJobStatus.PROCESSING,
        jobId: { not: jobId },
      },
      select: { jobId: true, startedAt: true },
    });
    if (sibling) {
      if (!sibling.startedAt || sibling.startedAt >= staleBefore) return "busy";
      await this.abandonIfStale(sibling.jobId, staleBefore, abandonedMessage);
    }
    await this.db.printJob.update({
      where: { jobId },
      data: {
        status: PrintJobStatus.PROCESSING,
        startedAt: new Date(),
        errorMsg: null,
      },
    });
    return "claimed";
  }

  public async markDone(jobId: string, fileId: string | null): Promise<boolean> {
    const { count } = await this.db.printJob.updateMany({
      where: { jobId, status: PrintJobStatus.PROCESSING },
      data: {
        status: PrintJobStatus.DONE,
        fileId,
        finishedAt: new Date(),
        errorMsg: null,
      },
    });
    return count > 0;
  }

  public async markProcessingFailure(
    jobId: string,
    status: PrintJobStatus,
    errorMsg: string,
  ): Promise<boolean> {
    const { count } = await this.db.printJob.updateMany({
      where: { jobId, status: PrintJobStatus.PROCESSING },
      data: { status, errorMsg, finishedAt: new Date() },
    });
    return count > 0;
  }

  public async markPendingFailed(jobId: string, errorMsg: string): Promise<void> {
    await this.db.printJob.updateMany({
      where: { jobId, status: PrintJobStatus.PENDING },
      data: { status: PrintJobStatus.FAILED, errorMsg, finishedAt: new Date() },
    });
  }

  public async abandonIfStale(
    jobId: string,
    staleBefore: Date,
    errorMsg: string,
  ): Promise<void> {
    await this.db.printJob.updateMany({
      where: {
        jobId,
        OR: [
          { status: PrintJobStatus.PENDING, createdAt: { lt: staleBefore } },
          { status: PrintJobStatus.PROCESSING, startedAt: { lt: staleBefore } },
        ],
      },
      data: { status: PrintJobStatus.FAILED, errorMsg, finishedAt: new Date() },
    });
  }
}
