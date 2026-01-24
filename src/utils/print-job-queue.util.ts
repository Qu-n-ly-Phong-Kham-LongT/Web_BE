import amqp, { Channel, ChannelModel } from "amqplib";

export const QUEUE_MAIN = "pdf_conversion";
export const QUEUE_RETRY = "pdf_conversion_retry";
export const QUEUE_DEAD = "pdf_conversion_dead";
export const EXCHANGE_DLX = "pdf_conversion_dlx";

const DEFAULT_RETRY_DELAY_MS = 5000;

let publishConnection: ChannelModel | null = null;
let publishChannel: Channel | null = null;

export function getNumberEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name] ?? fallback);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

export async function ensurePrintJobInfrastructure(
  channel: Channel,
): Promise<void> {
  const retryDelayMs = getNumberEnv(
    "RABBITMQ_JOB_RETRY_DELAY_MS",
    DEFAULT_RETRY_DELAY_MS,
  );

  await channel.assertExchange(EXCHANGE_DLX, "direct", { durable: true });
  await channel.assertQueue(QUEUE_DEAD, { durable: true });
  await channel.bindQueue(QUEUE_DEAD, EXCHANGE_DLX, QUEUE_DEAD);

  await channel.assertQueue(QUEUE_MAIN, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": EXCHANGE_DLX,
      "x-dead-letter-routing-key": QUEUE_DEAD,
    },
  });

  await channel.assertQueue(QUEUE_RETRY, {
    durable: true,
    arguments: {
      "x-message-ttl": retryDelayMs,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": QUEUE_MAIN,
    },
  });
}

async function getPublishChannel(): Promise<Channel> {
  if (publishChannel) return publishChannel;

  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not configured");
  }

  publishConnection = await amqp.connect(url);
  publishChannel = await publishConnection.createChannel();
  await ensurePrintJobInfrastructure(publishChannel);
  return publishChannel;
}

export async function enqueuePrintJob(jobId: string): Promise<void> {
  const channel = await getPublishChannel();
  const payload = Buffer.from(JSON.stringify({ jobId }), "utf-8");
  channel.sendToQueue(QUEUE_MAIN, payload, {
    persistent: true,
    contentType: "application/json",
  });
}
