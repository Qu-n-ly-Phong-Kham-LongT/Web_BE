import { Prisma, PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../config/database.config";
import { BaseError } from "./base-error.util";
import { enqueuePrintJob } from "./print-job-queue.util";

export const ACTIVE_PRINT_JOB_STALE_MS = 10 * 60 * 1000;

const ACTIVE_STATUSES = [PrintJobStatus.PENDING, PrintJobStatus.PROCESSING];

export type EnqueuePrintJobInput = {
  type: PrintJobType;
  entityId: string;
  clinicId?: string | null;
  userId?: string | null;
  payload: Prisma.InputJsonValue;
};

export type StoredPrintJob = {
  jobId: string;
  type: PrintJobType;
  entityId: string | null;
  status: PrintJobStatus;
  createdAt: Date;
};

export type LockedPrintJobStore = {
  findActive: (
    type: PrintJobType,
    entityId: string,
  ) => Promise<StoredPrintJob | null>;
  markAbandoned: (jobId: string) => Promise<void>;
  create: (input: EnqueuePrintJobInput) => Promise<StoredPrintJob>;
};

export type PrintJobEnqueueDeps = {
  now: () => Date;
  withEntityLock: <T>(
    type: PrintJobType,
    entityId: string,
    work: (store: LockedPrintJobStore) => Promise<T>,
  ) => Promise<T>;
  publish: (jobId: string) => Promise<void>;
  markPublishFailed: (jobId: string, errorMsg: string) => Promise<void>;
};

export type EnqueuedPrintJob = {
  jobId: string;
  status: PrintJobStatus;
  type: PrintJobType;
  reused: boolean;
};

const jobSelect = {
  jobId: true,
  type: true,
  entityId: true,
  status: true,
  createdAt: true,
} as const;

function lockStore(tx: Prisma.TransactionClient): LockedPrintJobStore {
  return {
    findActive: (type, entityId) =>
      tx.printJob.findFirst({
        where: { type, entityId, status: { in: ACTIVE_STATUSES } },
        orderBy: { createdAt: "desc" },
        select: jobSelect,
      }),
    markAbandoned: async (jobId) => {
      await tx.printJob.update({
        where: { jobId },
        data: {
          status: PrintJobStatus.FAILED,
          errorMsg: "Abandoned: no progress within the active job window",
          finishedAt: new Date(),
        },
      });
    },
    create: (input) =>
      tx.printJob.create({
        data: {
          type: input.type,
          status: PrintJobStatus.PENDING,
          entityId: input.entityId,
          clinicId: input.clinicId || null,
          userId: input.userId || null,
          payload: input.payload,
        },
        select: jobSelect,
      }),
  };
}

export const prismaPrintJobEnqueueDeps: PrintJobEnqueueDeps = {
  now: () => new Date(),
  withEntityLock: (type, entityId, work) =>
    prisma.$transaction(async (tx) => {
      const lockKey = `print-job:${type}:${entityId}`;
      await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(${lockKey}))) AS locked`;
      return work(lockStore(tx));
    }),
  publish: enqueuePrintJob,
  markPublishFailed: async (jobId, errorMsg) => {
    await prisma.printJob.update({
      where: { jobId },
      data: { status: PrintJobStatus.FAILED, errorMsg, finishedAt: new Date() },
    });
  },
};

function isFresh(job: StoredPrintJob, now: Date): boolean {
  return now.getTime() - job.createdAt.getTime() < ACTIVE_PRINT_JOB_STALE_MS;
}

export async function findOrEnqueuePrintJob(
  input: EnqueuePrintJobInput,
  deps: PrintJobEnqueueDeps = prismaPrintJobEnqueueDeps,
): Promise<EnqueuedPrintJob> {
  const { job, reused } = await deps.withEntityLock(
    input.type,
    input.entityId,
    async (store) => {
      const active = await store.findActive(input.type, input.entityId);
      if (active && isFresh(active, deps.now())) {
        return { job: active, reused: true };
      }
      if (active) {
        await store.markAbandoned(active.jobId);
      }
      return { job: await store.create(input), reused: false };
    },
  );

  if (!reused) {
    try {
      await deps.publish(job.jobId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `[rabbitmq][publisher] publish failed: jobId=${job.jobId} reason=${reason}`,
      );
      await deps
        .markPublishFailed(job.jobId, `Print queue unavailable: ${reason}`)
        .catch((updateError) => {
          console.error(
            `[rabbitmq][publisher] could not mark job failed: jobId=${job.jobId}`,
            updateError,
          );
        });
      throw new BaseError(503, "Print queue is unavailable, please try again");
    }
  }

  return { jobId: job.jobId, status: job.status, type: job.type, reused };
}
