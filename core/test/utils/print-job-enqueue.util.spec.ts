import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import {
  ACTIVE_PRINT_JOB_STALE_MS,
  findOrEnqueuePrintJob,
  type PrintJobEnqueueDeps,
  type StoredPrintJob,
} from "../../src/utils/print-job-enqueue.util";
import { BaseError } from "../../src/utils/base-error.util";

function createMemoryDeps(now: () => Date = () => new Date()) {
  const jobs: StoredPrintJob[] = [];
  const published: string[] = [];
  let sequence = 0;
  let lockChain: Promise<unknown> = Promise.resolve();

  const deps: PrintJobEnqueueDeps = {
    now,
    withEntityLock: (_type, _entityId, work) => {
      const run = lockChain.then(() =>
        work({
          findActive: async (type, entityId) =>
            jobs
              .filter(
                (j) =>
                  j.type === type &&
                  j.entityId === entityId &&
                  (j.status === PrintJobStatus.PENDING ||
                    j.status === PrintJobStatus.PROCESSING),
              )
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          markAbandoned: async (jobId) => {
            const job = jobs.find((j) => j.jobId === jobId);
            if (job) job.status = PrintJobStatus.FAILED;
          },
          create: async (input) => {
            await new Promise((resolve) => setTimeout(resolve, 2));
            sequence += 1;
            const job: StoredPrintJob = {
              jobId: `job-${sequence}`,
              type: input.type,
              entityId: input.entityId,
              status: PrintJobStatus.PENDING,
              createdAt: now(),
              startedAt: null,
            };
            jobs.push(job);
            return job;
          },
        }),
      );
      lockChain = run.catch(() => undefined);
      return run;
    },
    publish: async (jobId) => {
      published.push(jobId);
    },
    markPublishFailed: async (jobId) => {
      const job = jobs.find((j) => j.jobId === jobId);
      if (job) job.status = PrintJobStatus.FAILED;
    },
  };
  return { deps, jobs, published };
}

const RECORD_INPUT = {
  type: PrintJobType.MEDICAL_RECORD,
  entityId: "record-1",
  clinicId: "clinic-1",
  userId: null,
  payload: { recordId: "record-1" },
};

describe("findOrEnqueuePrintJob", () => {
  it("creates and publishes a job when none is active", async () => {
    const { deps, jobs, published } = createMemoryDeps();

    const result = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.equal(result.reused, false);
    assert.equal(jobs.length, 1);
    assert.deepEqual(published, [result.jobId]);
  });

  it("second request for same record reuses active job", async () => {
    const { deps, jobs, published } = createMemoryDeps();

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    const second = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.equal(second.reused, true);
    assert.equal(second.jobId, first.jobId);
    assert.equal(jobs.length, 1);
    assert.equal(published.length, 1);
  });

  it("concurrent requests for same record create a single job", async () => {
    const { deps, jobs } = createMemoryDeps();

    const results = await Promise.all(
      Array.from({ length: 10 }, () => findOrEnqueuePrintJob(RECORD_INPUT, deps)),
    );

    assert.equal(jobs.length, 1);
    assert.equal(new Set(results.map((r) => r.jobId)).size, 1);
  });

  it("different documents do not share a job", async () => {
    const { deps, jobs } = createMemoryDeps();

    await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    await findOrEnqueuePrintJob({ ...RECORD_INPUT, entityId: "record-2" }, deps);

    assert.equal(jobs.length, 2);
  });

  it("stale active job is replaced", async () => {
    let clock = new Date("2026-11-21T04:00:00Z");
    const { deps, jobs } = createMemoryDeps(() => clock);

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    clock = new Date(clock.getTime() + ACTIVE_PRINT_JOB_STALE_MS + 1);
    const second = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.notEqual(second.jobId, first.jobId);
    assert.equal(second.reused, false);
    assert.equal(jobs.find((j) => j.jobId === first.jobId)?.status, PrintJobStatus.FAILED);
  });

  it("edit during render creates exactly one successor job", async () => {
    const { deps, jobs } = createMemoryDeps();

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    jobs[0].status = PrintJobStatus.PROCESSING;
    const second = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    const third = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.notEqual(second.jobId, first.jobId);
    assert.equal(second.reused, false);
    assert.equal(third.jobId, second.jobId);
    assert.equal(third.reused, true);
    assert.equal(jobs.length, 2);
  });

  it("does not abandon a long-queued job that only just started rendering", async () => {
    let clock = new Date("2026-11-21T04:00:00Z");
    const { deps, jobs } = createMemoryDeps(() => clock);

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    clock = new Date(clock.getTime() + ACTIVE_PRINT_JOB_STALE_MS + 60_000);
    jobs[0].status = PrintJobStatus.PROCESSING;
    jobs[0].startedAt = new Date(clock.getTime() - 30_000);
    const second = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.notEqual(second.jobId, first.jobId);
    assert.equal(jobs.find((j) => j.jobId === first.jobId)?.status, PrintJobStatus.PROCESSING);
  });

  it("keeps a retried job that rendered recently", async () => {
    let clock = new Date("2026-11-21T04:00:00Z");
    const { deps, jobs } = createMemoryDeps(() => clock);

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    clock = new Date(clock.getTime() + ACTIVE_PRINT_JOB_STALE_MS + 60_000);
    jobs[0].startedAt = new Date(clock.getTime() - 30_000);
    const again = await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.equal(again.jobId, first.jobId);
    assert.equal(again.reused, true);
  });

  it("abandons a job that has been rendering for too long", async () => {
    let clock = new Date("2026-11-21T04:00:00Z");
    const { deps, jobs } = createMemoryDeps(() => clock);

    const first = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    jobs[0].status = PrintJobStatus.PROCESSING;
    jobs[0].startedAt = clock;
    clock = new Date(clock.getTime() + ACTIVE_PRINT_JOB_STALE_MS + 1);
    await findOrEnqueuePrintJob(RECORD_INPUT, deps);

    assert.equal(jobs.find((j) => j.jobId === first.jobId)?.status, PrintJobStatus.FAILED);
  });

  it("publish failure marks job failed", async () => {
    const { deps, jobs } = createMemoryDeps();
    deps.publish = async () => {
      throw new Error("connect ECONNREFUSED");
    };

    await assert.rejects(
      findOrEnqueuePrintJob(RECORD_INPUT, deps),
      (error: unknown) => error instanceof BaseError && error.statusCode === 503,
    );
    assert.equal(jobs[0].status, PrintJobStatus.FAILED);

    deps.publish = async () => undefined;
    const retry = await findOrEnqueuePrintJob(RECORD_INPUT, deps);
    assert.equal(retry.reused, false);
  });
});
