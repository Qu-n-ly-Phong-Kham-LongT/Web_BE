import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.config";
import { FileService } from "../modules/file/services/file.service";
import { IJwtPayload } from "../utils/jwt.util";

interface CustomRequest extends Request {
  payload?: IJwtPayload;
  files?: Request["files"];
}

const fileService = new FileService();

const maskSensitiveData = (data: any) => {
  if (!data || typeof data !== "object") return data;
  const sensitiveFields = [
    "password",
    "accessToken",
    "refreshToken",
    "token",
    "newPassword",
    "oldPassword",
  ];
  const maskedData = { ...data };

  for (const field of sensitiveFields) {
    if (field in maskedData) maskedData[field] = "***MASKED***";
  }
  return maskedData;
};

export const auditLogsMiddleware = (action: string, entityName: string) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody: any;

    res.send = function (body: any): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on("finish", async () => {
      try {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;
        const payload = req.payload;

        let parsedResBody: any = {};
        try {
          parsedResBody =
            typeof responseBody === "string"
              ? JSON.parse(responseBody)
              : responseBody;
        } catch {
          parsedResBody = { raw: "non-json" };
        }

        // Xử lý xóa file rác nếu thất bại
        if (!isSuccess && req.files) {
          const filesList = Array.isArray(req.files)
            ? req.files
            : Object.values(req.files).flat();

          if (filesList.length > 0) {
            for (const f of filesList) {
              await fileService.deleteByRelativePath(f.path).catch(() => {});
            }
          }
        }
        const user = payload?.userId
          ? await prisma.user.findUnique({
              where: { userId: payload.userId },
              select: { username: true },
            })
          : null;

        // GHI LOG
        await prisma.auditLog.create({
          data: {
            clinicId: payload?.clinicId,
            username: user?.username || "Unknown",
            role: payload?.roles ? payload.roles.join(", ") : null,

            action: action,
            entityName: entityName,
            entityId: req.params.id || req.body.id || null,

            requestMethod: req.method,
            requestUrl: req.originalUrl,
            remoteAddress: req.ip || req.socket.remoteAddress || null,

            requestBody: maskSensitiveData(req.body) || {},
            responseBody: maskSensitiveData(parsedResBody) || {},

            statusCode: statusCode,
            durationMs: durationMs,
          },
        });
      } catch (error) {
        console.error("AuditLog Error:", error);
      }
    });

    next();
  };
};
