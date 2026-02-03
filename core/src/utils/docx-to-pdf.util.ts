import http from "http";
import https from "https";
import { BaseError } from "./base-error.util";

// Các mặc định vẫn giữ nguyên
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_RETRY_BACKOFF_MS = 300;
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * XÓA BỎ: inFlight và waiters.
 * RabbitMQ sẽ là người giữ hàng đợi (waiters) và
 * tham số 'prefetch' của RabbitMQ sẽ quản lý 'inFlight'.
 */

function getRetryMax(): number {
  const raw = Number(process.env.CONVERT_RETRY_MAX ?? DEFAULT_RETRY_MAX);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : DEFAULT_RETRY_MAX;
}

function getRetryBackoffMs(): number {
  const raw = Number(
    process.env.CONVERT_RETRY_BACKOFF_MS ?? DEFAULT_RETRY_BACKOFF_MS,
  );
  return Number.isFinite(raw) && raw >= 0
    ? Math.floor(raw)
    : DEFAULT_RETRY_BACKOFF_MS;
}

function getTimeoutMs(): number {
  const raw = Number(process.env.CONVERT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_TIMEOUT_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof BaseError) {
    return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
  }
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return [
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EAI_AGAIN",
    "ENOTFOUND",
  ].includes(String(code ?? ""));
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = getRetryMax();
  const backoffMs = getRetryBackoffMs();
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!shouldRetry(error) || attempt >= maxRetries) {
        throw error;
      }
      console.warn(
        `Retry attempt ${attempt + 1} due to error:`,
        (error as Error).message,
      );
      await sleep(backoffMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }
}

export async function convertDocxToPdf(
  docxBuffer: Buffer,
  filename: string,
): Promise<Buffer> {
  const endpoint = process.env.CONVERT_FILE;
  if (!endpoint) {
    throw new BaseError(500, "CONVERT_FILE chưa được cấu hình");
  }

  const url = new URL(endpoint);
  const boundary = `----FormBoundary${Date.now()}`;
  const header =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n";
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(header, "utf-8"),
    docxBuffer,
    Buffer.from(footer, "utf-8"),
  ]);

  const apiKey = (
    process.env.CONVERT_API_KEY ??
    process.env.X_API_KEY ??
    ""
  ).trim();
  const isHttps = url.protocol === "https:";
  const requestFn = isHttps ? https.request : http.request;
  const port = url.port ? Number(url.port) : isHttps ? 443 : 80;
  const timeoutMs = getTimeoutMs();
  console.log(
    `[convert] start filename=${filename} bytes=${docxBuffer.length} timeoutMs=${timeoutMs} endpoint=${url.origin}${url.pathname}`,
  );

  const doRequest = async (): Promise<Buffer> =>
    new Promise<Buffer>((resolve, reject) => {
      const req = requestFn(
        {
          method: "POST",
          hostname: url.hostname,
          port,
          path: `${url.pathname}${url.search}`,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": body.length,
            ...(apiKey ? { "x-api-key": apiKey } : {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) =>
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
          );
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const status = res.statusCode ?? 500;
            console.log(
              `[convert] response status=${status} bytes=${buffer.length} contentType=${String(res.headers["content-type"] ?? "")}`,
            );

            if (status < 200 || status >= 300) {
              const bodyText = buffer.toString("utf-8").slice(0, 1000);
              reject(
                new BaseError(
                  status,
                  `Convert service failed with status ${status}`,
                  { body: bodyText },
                ),
              );
              return;
            }

            const contentType = String(res.headers["content-type"] ?? "");
            if (contentType.includes("application/json")) {
              try {
                const json = JSON.parse(buffer.toString("utf-8"));
                const base64 = json?.data ?? json?.file ?? json?.fileBase64;
                if (typeof base64 === "string") {
                  resolve(Buffer.from(base64, "base64"));
                  return;
                }
              } catch (e) {
                reject(new BaseError(500, "Invalid JSON response"));
                return;
              }
            }
            resolve(buffer);
          });
        },
      );

      req.setTimeout(timeoutMs, () => req.destroy(new Error("Timeout")));
      req.on("error", (err) => reject(new BaseError(500, err.message)));
      req.write(body);
      req.end();
    });

  return await withRetry(doRequest);
}
