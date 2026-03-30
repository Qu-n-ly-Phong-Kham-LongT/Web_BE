import amqp, { Channel, ChannelModel } from "amqplib";

export const QUEUE_MAIN = "pdf_conversion";
export const QUEUE_RETRY = "pdf_conversion_retry";
export const QUEUE_DEAD = "pdf_conversion_dead";
export const EXCHANGE_DLX = "pdf_conversion_dlx";
const RABBIT_PREFIX = "[rabbitmq][publisher]";

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

  console.log(
    `${RABBIT_PREFIX} infrastructure ready: main=${QUEUE_MAIN} retry=${QUEUE_RETRY} dead=${QUEUE_DEAD} retryDelayMs=${retryDelayMs}`,
  );
}

async function getPublishChannel(): Promise<Channel> {
  if (publishChannel) return publishChannel;

  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not configured");
  }

  console.log(`${RABBIT_PREFIX} connecting to RabbitMQ...`);
  publishConnection = await amqp.connect(url);
  publishConnection.on("error", (error) => {
    console.error(`${RABBIT_PREFIX} connection error`, error);
  });
  publishConnection.on("close", () => {
    console.warn(`${RABBIT_PREFIX} connection closed`);
    publishConnection = null;
    publishChannel = null;
  });

  publishChannel = await publishConnection.createChannel();
  publishChannel.on("error", (error) => {
    console.error(`${RABBIT_PREFIX} channel error`, error);
  });
  publishChannel.on("close", () => {
    console.warn(`${RABBIT_PREFIX} channel closed`);
    publishChannel = null;
  });
  await ensurePrintJobInfrastructure(publishChannel);
  console.log(
    `${RABBIT_PREFIX} channel ready: publishQueue=${QUEUE_MAIN}`,
  );
  return publishChannel;
}

export async function enqueuePrintJob(jobId: string): Promise<void> {
  const channel = await getPublishChannel();
  const payload = Buffer.from(JSON.stringify({ jobId }), "utf-8");
  const published = channel.sendToQueue(QUEUE_MAIN, payload, {
    persistent: true,
    contentType: "application/json",
  });
  console.log(
    `${RABBIT_PREFIX} publish jobId=${jobId} queue=${QUEUE_MAIN} bytes=${payload.length} buffered=${!published}`,
  );
}
