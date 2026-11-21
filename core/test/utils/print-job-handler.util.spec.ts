import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import {
  createPrintJobHandler,
  type PrintJobHandlerDeps,
} from "../../src/utils/print-job-handler.util";
import { BaseError } from "../../src/utils/base-error.util";
import { QUEUE_DEAD, QUEUE_RETRY } from "../../src/utils/print-job-queue.util";
import { buildMessage, FakeChannel } from "../helpers/fake-amqp";

type Emitted = { jobId: string; event: string; data: unknown };

function buildDeps(overrides: Partial<PrintJobHandlerDeps> = {}) {
  const emitted: Emitted[] = [];
  const failures: Array<{ jobId: string; status: PrintJobStatus }> = [];
  const deps: PrintJobHandlerDeps = {
    retryMax: 3,
    findJob: async (jobId) => ({
      jobId,
      type: PrintJobType.PRESCRIPTION,
      entityId: "entity-1",
      clinicId: "clinic-1",
    }),
    markProcessing: async () => undefined,
    generateFile: async () => ({
      fileId: "file-1",
      fileUrl: "https://files/x.pdf",
    }),
    markDone: async () => undefined,
    markFailure: async (jobId, status) => {
      failures.push({ jobId, status });
    },
    emit: (jobId, event, data) => {
      emitted.push({ jobId, event, data });
    },
    ...overrides,
  };
  return { deps, emitted, failures };
}

async function handle(
  channel: FakeChannel,
  deps: PrintJobHandlerDeps,
  jobId: string,
  retry = 0,
) {
  await createPrintJobHandler(deps)(
    channel.asChannel(),
    buildMessage({ jobId }, retry),
  );
}

describe("createPrintJobHandler", () => {
  it("acks once and emits print.done on success", async () => {
    const channel = new FakeChannel();
    const { deps, emitted } = buildDeps();

    await handle(channel, deps, "job-1");

    assert.equal(channel.acked.length, 1);
    assert.deepEqual(
      emitted.map((e) => e.event),
      ["print.processing", "print.done"],
    );
  });

  it("acks and skips when the job no longer exists", async () => {
    const channel = new FakeChannel();
    const { deps } = buildDeps({ findJob: async () => null });

    await handle(channel, deps, "missing");

    assert.equal(channel.acked.length, 1);
    assert.equal(channel.sent.length, 0);
  });

  it("message is settled when failure status update throws", async () => {
    const channel = new FakeChannel();
    const { deps } = buildDeps({
      generateFile: async () => {
        throw new BaseError(500, "Convert service failed with status 502");
      },
      markFailure: async () => {
        throw new Error("Database unavailable");
      },
    });

    await handle(channel, deps, "job-2");

    assert.equal(channel.acked.length, 1);
    assert.equal(channel.sent.length, 1);
    assert.equal(channel.sent[0].queue, QUEUE_RETRY);
    assert.equal(channel.sent[0].options?.headers?.["x-retry"], 1);
  });

  it("dead-letters a client error without retrying", async () => {
    const channel = new FakeChannel();
    const { deps, failures } = buildDeps({
      generateFile: async () => {
        throw new BaseError(400, "Missing prescription id");
      },
    });

    await handle(channel, deps, "job-3");

    assert.equal(channel.sent[0].queue, QUEUE_DEAD);
    assert.equal(channel.acked.length, 1);
    assert.deepEqual(failures, [
      { jobId: "job-3", status: PrintJobStatus.FAILED },
    ]);
  });

  it("dead-letters after the retry budget is spent", async () => {
    const channel = new FakeChannel();
    const { deps, failures } = buildDeps({
      generateFile: async () => {
        throw new Error("Timeout");
      },
    });

    await handle(channel, deps, "job-4", 3);

    assert.equal(channel.sent[0].queue, QUEUE_DEAD);
    assert.deepEqual(failures, [
      { jobId: "job-4", status: PrintJobStatus.FAILED },
    ]);
  });

  it("does not report failure when only the final ack fails", async () => {
    const channel = new FakeChannel();
    channel.ack = () => {
      throw new Error("Channel closed");
    };
    const { deps, failures, emitted } = buildDeps();

    await handle(channel, deps, "job-5");

    assert.deepEqual(failures, []);
    assert.ok(!emitted.some((e) => e.event === "print.failed"));
  });

  it("does not throw when the channel is gone during failure handling", async () => {
    const channel = new FakeChannel();
    channel.failOnSend = true;
    const { deps, failures } = buildDeps({
      generateFile: async () => {
        throw new Error("Timeout");
      },
    });

    await handle(channel, deps, "job-6");

    assert.equal(channel.acked.length, 0);
    assert.deepEqual(failures, [
      { jobId: "job-6", status: PrintJobStatus.PENDING },
    ]);
  });
});
