import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { parseDate } from "../../../utils/parseDate.util";
import { AuditLogService } from "../services/audit-log.service";

export class AuditLogController {
  private auditLogService = new AuditLogService();

  private parseDateOnlyUtc(value?: string) {
    if (!value) return undefined;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return undefined;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  public getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const size = Math.max(Number(req.query.size) || 10, 1);
    const username =
      (req.query.username as string | undefined) ||
      (req.query.search as string | undefined);

    const fromRaw =
      (req.query.from as string | undefined) ||
      (req.query.fromDate as string | undefined);
    const toRaw =
      (req.query.to as string | undefined) ||
      (req.query.toDate as string | undefined);

    const fromDate =
      this.parseDateOnlyUtc(fromRaw) ?? parseDate(fromRaw);
    const toDateDateOnly = this.parseDateOnlyUtc(toRaw);
    const toDate =
      toDateDateOnly
        ? new Date(
            Date.UTC(
              toDateDateOnly.getUTCFullYear(),
              toDateDateOnly.getUTCMonth(),
              toDateDateOnly.getUTCDate(),
              23,
              59,
              59,
              999,
            ),
          )
        : parseDate(toRaw);

    const sortByParam = (req.query.sortBy as string | undefined) ?? "createdAt";
    const sortBy = [
      "createdAt",
      "username",
      "action",
      "entityName",
      "statusCode",
      "durationMs",
    ].includes(sortByParam)
      ? (sortByParam as
          | "createdAt"
          | "username"
          | "action"
          | "entityName"
          | "statusCode"
          | "durationMs")
      : "createdAt";
    const sort =
      (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    const result = await this.auditLogService.getAuditLogs({
      page,
      size,
      search: username,
      fromDate,
      toDate,
      sortBy,
      sort,
      clinicId: req.payload?.clinicId ?? undefined,
      roles: req.payload?.roles ?? [],
    });

    return successResponse(
      res,
      200,
      result.logs,
      "Lấy danh sách audit log thành công",
      result.pagination,
    );
  };
}
