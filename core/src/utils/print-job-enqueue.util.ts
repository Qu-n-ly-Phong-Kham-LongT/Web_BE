import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../config/database.config";
import {
  NewPrintJob,
  PrintJobRepository,
  StoredPrintJob,
} from "../modules/print-job/repositories/print-job.repository";
import { BaseError } from "./base-error.util";
import { enqueuePrintJob } from "./print-job-queue.util";

export type { StoredPrintJob } from "../modules/print-job/repositories/print-job.repository";

export const ACTIVE_PRINT_JOB_STALE_MS = 10 * 60 * 1000;
export const PRINT_QUEUE_UNAVAILABLE_MESSAGE = "Print queue unavailable";
export const PRINT_JOB_ABANDONED_MESSAGE = "Print job abandoned";

export type EnqueuePrintJobInput = NewPrintJob;

export type LockedPrintJobStore = {
  findActive: (
    type: PrintJobType,
    entityId: string,
  ) => Promise<StoredPrintJob[]>;
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

function lockedStore(repository: PrintJobRepository): LockedPrintJobStore {
  return {
    findActive: (type, entityId) => repository.findActiveForEntity(type, entityId),
    markAbandoned: (jobId) =>
      repository.abandonIfStale(
        jobId,
        printJobStaleBefore(new Date()),
        PRINT_JOB_ABANDONED_MESSAGE,
      ),
    create: (input) => repository.create(input),
  };
}

export const prismaPrintJobEnqueueDeps: PrintJobEnqueueDeps = {
  now: () => new Date(),
  withEntityLock: (type, entityId, work) =>
    prisma.$transaction(async (tx) => {
      const repository = new PrintJobRepository(tx);
      await repository.lockEntity(type, entityId);
      return work(lockedStore(repository));
    }),
  publish: enqueuePrintJob,
  markPublishFailed: async (jobId, errorMsg) => {
    await new PrintJobRepository().markPendingFailed(jobId, errorMsg);
  },
};

export function printJobStaleBefore(now: Date): Date {
  return new Date(now.getTime() - ACTIVE_PRINT_JOB_STALE_MS);
}

function isFresh(job: StoredPrintJob, now: Date): boolean {
  const since = job.startedAt ?? job.createdAt;
  return since >= printJobStaleBefore(now);
}

export async function findOrEnqueuePrintJob(
  input: EnqueuePrintJobInput,
  deps: PrintJobEnqueueDeps = prismaPrintJobEnqueueDeps,
): Promise<EnqueuedPrintJob> {
  const { job, reused } = await deps.withEntityLock(
    input.type,
    input.entityId,
    async (store) => {
      const now = deps.now();
      const active = await store.findActive(input.type, input.entityId);
      for (const stale of active.filter((j) => !isFresh(j, now))) {
        await store.markAbandoned(stale.jobId);
      }
      const queued = active.find(
        (j) => j.status === PrintJobStatus.PENDING && isFresh(j, now),
      );
      if (queued) {
        return { job: queued, reused: true };
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
        .markPublishFailed(job.jobId, PRINT_QUEUE_UNAVAILABLE_MESSAGE)
        .catch((updateError) => {
          console.error(
            `[rabbitmq][publisher] could not mark job failed: jobId=${job.jobId}`,
            updateError,
          );
        });
      throw new BaseError(503, PRINT_QUEUE_UNAVAILABLE_MESSAGE);
    }
  }

  return { jobId: job.jobId, status: job.status, type: job.type, reused };
}
