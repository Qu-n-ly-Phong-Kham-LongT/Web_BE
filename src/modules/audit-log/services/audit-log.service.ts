import { UserRoleEnum } from "@prisma/client";
import { AuditLogRepository } from "../repositories/audit-log.repository";
import { createPagination } from "../../../utils/pagination.util";
import { BaseError } from "../../../utils/base-error.util";

export class AuditLogService {
  private repo = new AuditLogRepository();

  public async getAuditLogs(params: {
    page?: number;
    size?: number;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
    sortBy?: "createdAt" | "username" | "action" | "entityName" | "statusCode" | "durationMs";
    sort?: "asc" | "desc";
    clinicId?: string;
    roles?: string[];
  }) {
    const {
      page = 1,
      size = 10,
      search,
      fromDate,
      toDate,
      sortBy,
      sort,
      clinicId,
      roles,
    } = params;

    if (fromDate && toDate && fromDate > toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được lớn hơn ngày kết thúc");
    }

    const isAdmin = (roles ?? []).includes(UserRoleEnum.Admin);
    const scopedClinicId = isAdmin ? undefined : clinicId ?? undefined;

    const { items, totalItems } = await this.repo.findLogs({
      page,
      size,
      search,
      fromDate,
      toDate,
      sortBy,
      sort,
      clinicId: scopedClinicId,
    });

    return {
      logs: items,
      pagination: createPagination(page, size, totalItems),
    };
  }
}
