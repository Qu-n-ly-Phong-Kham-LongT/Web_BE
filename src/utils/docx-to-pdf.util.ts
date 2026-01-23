import http from "http";
import https from "https";
import { BaseError } from "./base-error.util";

const DEFAULT_MAX_CONCURRENCY = 1;
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_RETRY_BACKOFF_MS = 300;
const DEFAULT_TIMEOUT_MS = 15000;

let inFlight = 0;
const waiters: Array<() => void> = [];

function getMaxConcurrency(): number {
  const raw = Number(
    process.env.CONVERT_MAX_CONCURRENCY ?? DEFAULT_MAX_CONCURRENCY,
  );
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MAX_CONCURRENCY;
}

function getRetryMax(): number {
  const raw = Number(process.env.CONVERT_RETRY_MAX ?? DEFAULT_RETRY_MAX);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : DEFAULT_RETRY_MAX;
}

function getRetryBackoffMs(): number {
  const raw = Number(process.env.CONVERT_RETRY_BACKOFF_MS ?? DEFAULT_RETRY_BACKOFF_MS);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : DEFAULT_RETRY_BACKOFF_MS;
}

function getTimeoutMs(): number {
  const raw = Number(process.env.CONVERT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_TIMEOUT_MS;
}

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  const maxConcurrency = getMaxConcurrency();
  if (inFlight >= maxConcurrency) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  inFlight += 1;
  try {
    return await fn();
  } finally {
    inFlight -= 1;
    const next = waiters.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof BaseError) {
    return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
  }
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND"].includes(
    String(code ?? ""),
  );
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = getRetryMax();
  const backoffMs = getRetryBackoffMs();
  let attempt = 0;
  // maxRetries = number of retries after the first attempt.
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!shouldRetry(error) || attempt >= maxRetries) {
        throw error;
      }
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

  const doConvert = async (): Promise<Buffer> =>
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
          res.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const status = res.statusCode ?? 500;
            if (status < 200 || status >= 300) {
              const contentType = String(res.headers["content-type"] ?? "");
              const bodyText = buffer.toString("utf-8").slice(0, 2000);
              console.error("Convert service error:", {
                status,
                contentType,
                body: bodyText,
              });
              reject(
                new BaseError(status, "Convert service failed", {
                  contentType,
                  body: bodyText,
                }),
              );
              return;
            }
            const contentType = String(res.headers["content-type"] ?? "");
            if (contentType.includes("application/json")) {
              try {
                const json = JSON.parse(buffer.toString("utf-8"));
                const base64 =
                  json?.data ?? json?.file ?? json?.fileBase64 ?? null;
                if (typeof base64 === "string") {
                  resolve(Buffer.from(base64, "base64"));
                  return;
                }
              } catch (error) {
                reject(new BaseError(500, "Invalid convert response"));
                console.error("Lỗi convert file pdf: ", error);
                return;
              }
            }
            resolve(buffer);
          });
        },
      );

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error("Convert request timeout"));
      });

      req.on("error", (error) => {
        reject(
          new BaseError(
            500,
            error instanceof Error ? error.message : "Convert failed",
          ),
        );
        console.error("Lỗi convert file pdf: ", error);
      });
      req.write(body);
      req.end();
    });

  return await withRetry(() => withConcurrencyLimit(doConvert));
}
