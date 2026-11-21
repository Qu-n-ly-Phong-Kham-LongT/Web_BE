import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import {
  ensurePrintJobInfrastructure,
  QUEUE_DEAD,
  QUEUE_MAIN,
  QUEUE_RETRY,
} from "./print-job-queue.util";

const WORKER_PREFIX = "[rabbitmq][worker]";
const DEFAULT_MIN_RECONNECT_DELAY_MS = 1000;
const DEFAULT_MAX_RECONNECT_DELAY_MS = 30000;

export type PrintMessageHandler = (
  channel: Channel,
  msg: ConsumeMessage,
) => Promise<void>;

export type PrintWorkerOptions = {
  url: string;
  prefetch: number;
  handleMessage: PrintMessageHandler;
  connect?: (url: string) => Promise<ChannelModel>;
  minReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
};

export type PrintWorkerHandle = {
  stop: () => Promise<void>;
  isConsuming: () => boolean;
};

export function reconnectDelayMs(
  attempt: number,
  minDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
}

export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error as NodeJS.ErrnoException).code;
  const parts = [code, error.message].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : error.name;
}

export function startPrintWorker(options: PrintWorkerOptions): PrintWorkerHandle {
  const connect = options.connect ?? ((url: string) => amqp.connect(url));
  const minDelayMs = options.minReconnectDelayMs ?? DEFAULT_MIN_RECONNECT_DELAY_MS;
  const maxDelayMs = options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;

  let stopped = false;
  let attempt = 0;
  let consuming = false;
  let activeConnection: ChannelModel | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const closeQuietly = (connection: ChannelModel) => {
    connection.close().catch(() => undefined);
  };

  const scheduleReconnect = (reason: string) => {
    consuming = false;
    activeConnection = null;
    if (stopped || reconnectTimer) return;
    const delayMs = reconnectDelayMs(attempt, minDelayMs, maxDelayMs);
    attempt += 1;
    console.warn(
      `${WORKER_PREFIX} reconnect scheduled: inMs=${delayMs} attempt=${attempt} reason=${reason}`,
    );
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connectAndConsume();
    }, delayMs);
  };

  const connectAndConsume = async (): Promise<void> => {
    if (stopped) return;
    let connection: ChannelModel | null = null;
    try {
      console.log(`${WORKER_PREFIX} connecting to RabbitMQ...`);
      connection = await connect(options.url);
      const current = connection;

      current.on("error", (error) => {
        console.error(`${WORKER_PREFIX} connection error`, error);
      });
      current.on("close", () => {
        if (activeConnection !== current) return;
        console.warn(`${WORKER_PREFIX} connection closed`);
        scheduleReconnect("connection closed");
      });

      const channel = await current.createChannel();
      channel.on("error", (error) => {
        console.error(`${WORKER_PREFIX} channel error`, error);
      });
      channel.on("close", () => {
        console.warn(`${WORKER_PREFIX} channel closed`);
        closeQuietly(current);
      });

      await ensurePrintJobInfrastructure(channel);
      await channel.prefetch(options.prefetch);
      await channel.consume(
        QUEUE_MAIN,
        (msg) => {
          if (!msg) {
            console.warn(`${WORKER_PREFIX} consumer cancelled by broker`);
            closeQuietly(current);
            return;
          }
          options.handleMessage(channel, msg).catch((error) => {
            console.error(`${WORKER_PREFIX} handler crashed`, error);
          });
        },
        { noAck: false },
      );

      if (stopped) {
        closeQuietly(current);
        return;
      }
      activeConnection = current;
      consuming = true;
      attempt = 0;
      console.log(
        `${WORKER_PREFIX} started: consumeQueue=${QUEUE_MAIN} retryQueue=${QUEUE_RETRY} deadQueue=${QUEUE_DEAD} prefetch=${options.prefetch}`,
      );
    } catch (error) {
      console.error(
        `${WORKER_PREFIX} start failed: ${describeError(error)}`,
      );
      if (connection) closeQuietly(connection);
      scheduleReconnect(describeError(error));
    }
  };

  void connectAndConsume();

  return {
    isConsuming: () => consuming,
    stop: async () => {
      stopped = true;
      consuming = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      const connection = activeConnection;
      activeConnection = null;
      if (connection) {
        await connection.close().catch(() => undefined);
      }
    },
  };
}
