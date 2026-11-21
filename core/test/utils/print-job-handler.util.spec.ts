import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import {
  createPrintJobHandler,
  type PrintJobHandlerDeps,
} from "../../src/utils/print-job-handler.util";
import { BaseError } from "../../src/utils/base-error.util";
import { QUEUE_DEAD, QUEUE_RETRY } from "../../src/utils/print-job-queue.util";
import { PRINT_JOB_FAILED_MESSAGE } from "../../src/utils/print-job-handler.util";
import { buildMessage, FakeChannel } from "../helpers/fake-amqp";

type Emitted = { jobId: string; event: string; data: unknown };

function buildDeps(overrides: Partial<PrintJobHandlerDeps> = {}) {
  const emitted: Emitted[] = [];
  const failures: Array<{ jobId: string; status: PrintJobStatus }> = [];
  const reasons: string[] = [];
  const unclaimed: string[] = [];
  const deps: PrintJobHandlerDeps = {
    retryMax: 3,
    findJob: async (jobId) => ({
      jobId,
      type: PrintJobType.PRESCRIPTION,
      entityId: "entity-1",
      clinicId: "clinic-1",
    }),
    claimJob: async () => "claimed",
    generateFile: async () => ({
      fileId: "file-1",
      fileUrl: "https://files/x.pdf",
    }),
    markDone: async () => true,
    markFailure: async (jobId, status, errorMsg) => {
      failures.push({ jobId, status });
      reasons.push(errorMsg);
    },
    markUnclaimedFailed: async (jobId, errorMsg) => {
      unclaimed.push(jobId);
      reasons.push(errorMsg);
    },
    emit: (jobId, event, data) => {
      emitted.push({ jobId, event, data });
    },
    ...overrides,
  };
  return { deps, emitted, failures, reasons, unclaimed };
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

  it("skips a job that already finished without regenerating it", async () => {
    const channel = new FakeChannel();
    let generated = 0;
    const { deps, emitted } = buildDeps({
      claimJob: async () => "finished",
      generateFile: async () => {
        generated += 1;
        return { fileId: "file-1", fileUrl: null };
      },
    });

    await handle(channel, deps, "job-done");

    assert.equal(generated, 0);
    assert.equal(channel.acked.length, 1);
    assert.equal(channel.sent.length, 0);
    assert.deepEqual(emitted, []);
  });

  it("requeues a job whose document is already rendering without spending a retry", async () => {
    const channel = new FakeChannel();
    let generated = 0;
    const { deps, emitted } = buildDeps({
      claimJob: async () => "busy",
      generateFile: async () => {
        generated += 1;
        return { fileId: null, fileUrl: null };
      },
    });

    await handle(channel, deps, "job-busy", 2);

    assert.equal(generated, 0);
    assert.equal(channel.sent.length, 1);
    assert.equal(channel.sent[0].queue, QUEUE_RETRY);
    assert.equal(channel.sent[0].options?.headers?.["x-retry"], 2);
    assert.equal(channel.acked.length, 1);
    assert.deepEqual(emitted, []);
  });

  it("waits for the in-flight run when the broker redelivers the same job", async () => {
    let release: () => void = () => undefined;
    let generated = 0;
    let finished = false;
    const { deps } = buildDeps({
      claimJob: async () => (finished ? "finished" : "claimed"),
      generateFile: async () => {
        generated += 1;
        await new Promise<void>((resolve) => (release = resolve));
        return { fileId: "file-1", fileUrl: null };
      },
      markDone: async () => {
        finished = true;
        return true;
      },
    });
    const handler = createPrintJobHandler(deps);
    const oldChannel = new FakeChannel();
    const newChannel = new FakeChannel();

    const first = handler(oldChannel.asChannel(), buildMessage({ jobId: "job-r" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    const redelivered = handler(newChannel.asChannel(), buildMessage({ jobId: "job-r" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(newChannel.acked.length, 0);

    release();
    await Promise.all([first, redelivered]);

    assert.equal(generated, 1);
    assert.equal(newChannel.acked.length, 1);
  });

  it("reprocesses a redelivered job when the earlier run failed on a broken channel", async () => {
    let attempts = 0;
    let release: () => void = () => undefined;
    const { deps } = buildDeps({
      generateFile: async () => {
        attempts += 1;
        if (attempts === 1) {
          await new Promise<void>((resolve) => (release = resolve));
          throw new Error("Timeout");
        }
        return { fileId: "file-2", fileUrl: null };
      },
    });
    const handler = createPrintJobHandler(deps);
    const brokenChannel = new FakeChannel();
    brokenChannel.failOnSend = true;
    const newChannel = new FakeChannel();

    const first = handler(brokenChannel.asChannel(), buildMessage({ jobId: "job-x" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    const redelivered = handler(newChannel.asChannel(), buildMessage({ jobId: "job-x" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    release();
    await Promise.all([first, redelivered]);

    assert.equal(attempts, 2);
    assert.equal(newChannel.acked.length, 1);
  });

  it("records a final failure that happened before the job was claimed", async () => {
    const channel = new FakeChannel();
    const { deps, unclaimed, failures } = buildDeps({
      claimJob: async () => {
        throw new Error("Transaction timeout");
      },
    });

    await handle(channel, deps, "job-u", 3);

    assert.deepEqual(unclaimed, ["job-u"]);
    assert.deepEqual(failures, []);
    assert.equal(channel.sent[0].queue, QUEUE_DEAD);
  });

  it("records a final failure before dead-lettering the message", async () => {
    const order: string[] = [];
    const channel = new FakeChannel();
    const send = channel.sendToQueue.bind(channel);
    channel.sendToQueue = (queue, content, options) => {
      order.push(`send:${queue}`);
      return send(queue, content, options);
    };
    const { deps } = buildDeps({
      generateFile: async () => {
        throw new BaseError(400, "Missing prescription id");
      },
      markFailure: async () => {
        order.push("db");
      },
    });

    await handle(channel, deps, "job-o");

    assert.deepEqual(order, ["db", `send:${QUEUE_DEAD}`]);
  });

  it("stores a generic reason for technical failures and keeps business messages", async () => {
    const technical = buildDeps({
      generateFile: async () => {
        throw new Error("connect ECONNREFUSED 10.0.0.9:2003");
      },
    });
    await handle(new FakeChannel(), technical.deps, "job-t", 3);
    assert.deepEqual(technical.reasons, [PRINT_JOB_FAILED_MESSAGE]);

    const business = buildDeps({
      generateFile: async () => {
        throw new BaseError(400, "Prescription already issued");
      },
    });
    await handle(new FakeChannel(), business.deps, "job-b");
    assert.deepEqual(business.reasons, ["Prescription already issued"]);
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

  it("retryable failure emits print.retrying not print.failed", async () => {
    const channel = new FakeChannel();
    const { deps, emitted } = buildDeps({
      generateFile: async () => {
        throw new Error("Timeout");
      },
    });

    await handle(channel, deps, "job-7");

    const events = emitted.map((e) => e.event);
    assert.ok(events.includes("print.retrying"));
    assert.ok(!events.includes("print.failed"));
  });

  it("final failure emits print.failed with FAILED status", async () => {
    const channel = new FakeChannel();
    const { deps, emitted } = buildDeps({
      generateFile: async () => {
        throw new BaseError(400, "Missing prescription id");
      },
    });

    await handle(channel, deps, "job-8");

    const failed = emitted.find((e) => e.event === "print.failed");
    assert.deepEqual(failed?.data, {
      jobId: "job-8",
      status: PrintJobStatus.FAILED,
      errorMsg: "Missing prescription id",
      retry: 0,
    });
    assert.ok(!emitted.some((e) => e.event === "print.retrying"));
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
