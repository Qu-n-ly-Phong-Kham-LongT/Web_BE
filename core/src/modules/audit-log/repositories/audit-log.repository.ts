import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class AuditLogRepository {
  public async findLogs(params: {
    page: number;
    size: number;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
    sortBy?: "createdAt" | "username" | "action" | "entityName" | "statusCode" | "durationMs";
    sort?: "asc" | "desc";
    clinicId?: string;
  }): Promise<{ items: any[]; totalItems: number }> {
    const {
      page,
      size,
      search,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sort = "desc",
      clinicId,
    } = params;

    const skip = (page - 1) * size;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (fromDate) {
      dateFilter.gte = fromDate;
    }
    if (toDate) {
      dateFilter.lte = toDate;
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(clinicId ? { clinicId } : {}),
      ...(search
        ? { username: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(fromDate || toDate ? { createdAt: dateFilter } : {}),
    };

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [sortBy]: sort,
    };

    const [items, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, totalItems };
  }
}
