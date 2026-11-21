import { EventEmitter } from "node:events";
import type { Channel, ChannelModel, ConsumeMessage, Options } from "amqplib";

export type SentMessage = {
  queue: string;
  content: Buffer;
  options?: Options.Publish;
};

export class FakeChannel extends EventEmitter {
  public consumers = new Map<string, (msg: ConsumeMessage | null) => void>();
  public acked: ConsumeMessage[] = [];
  public nacked: ConsumeMessage[] = [];
  public sent: SentMessage[] = [];
  public prefetchCount = 0;
  public failOnSend = false;

  async assertExchange() {
    return {};
  }

  async assertQueue() {
    return {};
  }

  async bindQueue() {
    return {};
  }

  async prefetch(count: number) {
    this.prefetchCount = count;
  }

  async consume(
    queue: string,
    onMessage: (msg: ConsumeMessage | null) => void,
  ) {
    this.consumers.set(queue, onMessage);
    return { consumerTag: `ctag-${queue}` };
  }

  ack(msg: ConsumeMessage) {
    this.acked.push(msg);
  }

  nack(msg: ConsumeMessage) {
    this.nacked.push(msg);
  }

  sendToQueue(queue: string, content: Buffer, options?: Options.Publish) {
    if (this.failOnSend) {
      throw new Error("Channel closed");
    }
    this.sent.push({ queue, content, options });
    return true;
  }

  asChannel(): Channel {
    return this as unknown as Channel;
  }
}

export class FakeConnection extends EventEmitter {
  public channels: FakeChannel[] = [];
  public closed = false;

  async createChannel() {
    const channel = new FakeChannel();
    this.channels.push(channel);
    return channel;
  }

  async close() {
    if (this.closed) {
      throw new Error("Connection already closed");
    }
    this.closed = true;
    this.emit("close");
  }

  asChannelModel(): ChannelModel {
    return this as unknown as ChannelModel;
  }
}

export function connectionRefused(): NodeJS.ErrnoException {
  return Object.assign(new Error("connect ECONNREFUSED 172.20.0.3:5672"), {
    code: "ECONNREFUSED",
  });
}

export function buildMessage(payload: unknown, retry = 0): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(payload), "utf-8"),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: "",
      routingKey: "pdf_conversion",
      consumerTag: "ctag",
    },
    properties: {
      contentType: "application/json",
      headers: { "x-retry": retry },
    },
  } as unknown as ConsumeMessage;
}

export async function waitFor(
  condition: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const startedAt = Date.now();
  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
