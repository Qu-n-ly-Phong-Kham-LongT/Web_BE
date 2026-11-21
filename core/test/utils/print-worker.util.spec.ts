import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ChannelModel } from "amqplib";
import {
  describeError,
  reconnectDelayMs,
  startPrintWorker,
} from "../../src/utils/print-worker.util";
import { QUEUE_MAIN } from "../../src/utils/print-job-queue.util";
import {
  connectionRefused,
  FakeConnection,
  waitFor,
} from "../helpers/fake-amqp";

function scriptedConnector(script: Array<FakeConnection | Error>) {
  const calls: FakeConnection[] = [];
  let index = 0;
  const connect = async (): Promise<ChannelModel> => {
    const next = script[Math.min(index, script.length - 1)];
    index += 1;
    if (next instanceof Error) {
      throw next;
    }
    calls.push(next);
    return next.asChannelModel();
  };
  return { connect, calls, attempts: () => index };
}

function startWith(connect: () => Promise<ChannelModel>, prefetch = 1) {
  return startPrintWorker({
    url: "amqp://test",
    prefetch,
    handleMessage: async () => undefined,
    connect,
    minReconnectDelayMs: 1,
    maxReconnectDelayMs: 5,
  });
}

describe("startPrintWorker", () => {
  it("worker reconnects after initial ECONNREFUSED", async () => {
    const connection = new FakeConnection();
    const connector = scriptedConnector([
      connectionRefused(),
      connectionRefused(),
      connection,
    ]);
    const worker = startWith(connector.connect, 2);

    await waitFor(() => worker.isConsuming());

    assert.equal(connector.attempts(), 3);
    const channel = connection.channels[0];
    assert.ok(channel.consumers.has(QUEUE_MAIN));
    assert.equal(channel.prefetchCount, 2);
    await worker.stop();
  });

  it("worker resubscribes after channel close", async () => {
    const first = new FakeConnection();
    const second = new FakeConnection();
    const connector = scriptedConnector([first, second]);
    const worker = startWith(connector.connect);
    await waitFor(() => worker.isConsuming());

    first.channels[0].emit("close");

    await waitFor(() => connector.calls.length === 2 && worker.isConsuming());
    assert.equal(first.closed, true);
    assert.ok(second.channels[0].consumers.has(QUEUE_MAIN));
    await worker.stop();
  });

  it("worker resubscribes after the broker cancels the consumer", async () => {
    const first = new FakeConnection();
    const second = new FakeConnection();
    const connector = scriptedConnector([first, second]);
    const worker = startWith(connector.connect);
    await waitFor(() => worker.isConsuming());

    first.channels[0].consumers.get(QUEUE_MAIN)?.(null);

    await waitFor(() => connector.calls.length === 2 && worker.isConsuming());
    await worker.stop();
  });

  it("stopped worker does not reconnect", async () => {
    const first = new FakeConnection();
    const connector = scriptedConnector([first, new FakeConnection()]);
    const worker = startWith(connector.connect);
    await waitFor(() => worker.isConsuming());

    await worker.stop();
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(connector.attempts(), 1);
    assert.equal(worker.isConsuming(), false);
  });
});

describe("describeError", () => {
  it("keeps the error code when the message is empty", () => {
    const refused = Object.assign(new Error(""), {
      code: "ECONNREFUSED",
    });
    assert.equal(describeError(refused), "ECONNREFUSED");
  });

  it("joins code and message", () => {
    assert.equal(
      describeError(connectionRefused()),
      "ECONNREFUSED connect ECONNREFUSED 172.20.0.3:5672",
    );
  });
});

describe("reconnectDelayMs", () => {
  it("doubles per attempt and caps at the maximum", () => {
    assert.equal(reconnectDelayMs(0, 1000, 30000), 1000);
    assert.equal(reconnectDelayMs(3, 1000, 30000), 8000);
    assert.equal(reconnectDelayMs(10, 1000, 30000), 30000);
  });
});
