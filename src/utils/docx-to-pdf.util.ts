import http from "http";
import https from "https";
import { BaseError } from "./base-error.util";

export async function convertDocxToPdf(
  docxBuffer: Buffer,
  filename: string
): Promise<Buffer> {
  const endpoint = process.env.CONVERT_FILE;
  if (!endpoint) {
    throw new BaseError(500, "CONVERT_FILE is not configured");
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
  const apiKey =
    (process.env.CONVERT_API_KEY ?? process.env.X_API_KEY ?? "").trim();

  const isHttps = url.protocol === "https:";
  const requestFn = isHttps ? https.request : http.request;
  const port = url.port ? Number(url.port) : isHttps ? 443 : 80;

  return await new Promise<Buffer>((resolve, reject) => {
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
            reject(new BaseError(status, "Convert service failed"));
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
              return;
            }
          }
          resolve(buffer);
        });
      }
    );

    req.on("error", (error) => {
      reject(
        new BaseError(
          500,
          error instanceof Error ? error.message : "Convert failed"
        )
      );
    });
    req.write(body);
    req.end();
  });
}
