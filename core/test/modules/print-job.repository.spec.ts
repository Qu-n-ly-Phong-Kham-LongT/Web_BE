import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma, PrintJobStatus, PrintJobType } from "@prisma/client";
import { PrintJobRepository } from "../../src/modules/print-job/repositories/print-job.repository";

type MutableJob = {
  status: PrintJobStatus;
  createdAt: Date;
  startedAt: Date | null;
};

function repositoryWith(current: MutableJob | null) {
  const writes: Array<Record<string, unknown>> = [];
  const database = {
    printJob: {
      findUnique: async () => current,
      findFirst: async () => null,
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push(args.data);
        if (current) Object.assign(current, args.data);
        return current;
      },
      updateMany: async (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (
          current &&
          args.where.status &&
          current.status !== args.where.status
        ) {
          return { count: 0 };
        }
        if (
          current &&
          args.where.startedAt instanceof Date &&
          current.startedAt?.getTime() !== args.where.startedAt.getTime()
        ) {
          return { count: 0 };
        }
        writes.push(args.data);
        if (current) Object.assign(current, args.data);
        return { count: current ? 1 : 0 };
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { repository: new PrintJobRepository(database), writes };
}

describe("PrintJobRepository.claimLocked", () => {
  const now = new Date("2026-11-21T04:00:00Z");
  const staleBefore = new Date(now.getTime() - 10 * 60_000);

  it("does not claim a job that another worker is still rendering", async () => {
    const { repository, writes } = repositoryWith({
      status: PrintJobStatus.PROCESSING,
      createdAt: new Date(now.getTime() - 20 * 60_000),
      startedAt: new Date(now.getTime() - 30_000),
    });

    const result = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );

    assert.equal(result.outcome, "busy");
    assert.deepEqual(writes, []);
  });

  it("takes over a processing job after its lease expires", async () => {
    const { repository, writes } = repositoryWith({
      status: PrintJobStatus.PROCESSING,
      createdAt: new Date(now.getTime() - 20 * 60_000),
      startedAt: new Date(now.getTime() - 11 * 60_000),
    });

    const result = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );

    assert.equal(result.outcome, "claimed");
    assert.equal(writes.length, 1);
    assert.equal(writes[0].status, PrintJobStatus.PROCESSING);
  });

  it("uses creation time to recover legacy processing rows without a lease", async () => {
    const { repository } = repositoryWith({
      status: PrintJobStatus.PROCESSING,
      createdAt: new Date(now.getTime() - 11 * 60_000),
      startedAt: null,
    });

    const result = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );

    assert.equal(result.outcome, "claimed");
  });

  it("keeps a retry pending when its last render started recently", async () => {
    const { repository } = repositoryWith({
      status: PrintJobStatus.PENDING,
      createdAt: new Date(now.getTime() - 20 * 60_000),
      startedAt: new Date(now.getTime() - 30_000),
    });

    const result = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );

    assert.equal(result.outcome, "claimed");
  });

  it("expires a pending job that has never started and waited too long", async () => {
    const { repository, writes } = repositoryWith({
      status: PrintJobStatus.PENDING,
      createdAt: new Date(now.getTime() - 11 * 60_000),
      startedAt: null,
    });

    const result = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );

    assert.equal(result.outcome, "expired");
    assert.equal(writes[0].status, PrintJobStatus.FAILED);
  });

  it("rejects completion and failure writes from an older lease", async () => {
    const oldLease = new Date(now.getTime() - 11 * 60_000);
    const current = {
      status: PrintJobStatus.PROCESSING,
      createdAt: new Date(now.getTime() - 20 * 60_000),
      startedAt: oldLease,
    };
    const { repository } = repositoryWith(current);
    const claim = await repository.claimLocked(
      "job-1",
      PrintJobType.MEDICAL_RECORD,
      "record-1",
      staleBefore,
      "Print job abandoned",
    );
    assert.equal(claim.outcome, "claimed");
    if (claim.outcome !== "claimed") return;

    const done = await repository.markDone("job-1", "file-old", oldLease);
    const failed = await repository.markProcessingFailure(
      "job-1",
      PrintJobStatus.FAILED,
      "old render failed",
      oldLease,
    );

    assert.equal(done, false);
    assert.equal(failed, false);
    assert.equal(current.status, PrintJobStatus.PROCESSING);
    assert.equal(current.startedAt, claim.leaseStartedAt);
  });
});
