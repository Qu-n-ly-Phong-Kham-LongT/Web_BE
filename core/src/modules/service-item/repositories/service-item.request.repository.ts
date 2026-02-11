import { Prisma, ServiceItem } from "@prisma/client";
import {
  CreateServiceItemConfigDto,
  CreateServiceItemRequestDto,
} from "../dtos/service-item.request.dto";
import { prisma } from "../../../config/database.config";
import { includes } from "lodash";
import { BaseError } from "../../../utils/base-error.util";

export class ServiceItemRepository {
  public async findByCode(code: string): Promise<ServiceItem | null> {
    return prisma.serviceItem.findFirst({
      where: { itemCode: code, isActive: true },
    });
  }

  public async findById(itemId: string) {
    return prisma.serviceItem.findFirst({
      where: { itemId, isActive: true },
      include: {
        configs: true,
        category: true,
        type: true,
      },
    });
  }

  public async findAll(params: {
    skip: number;
    take: number;
    search?: string;
    typeId?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const { skip, take, search, typeId, categoryId, isActive } = params;

    const where: Prisma.ServiceItemWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { itemCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        typeId ? { typeId } : {},
        categoryId ? { categoryId } : {},
        isActive === undefined ? {} : { isActive },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.serviceItem.findMany({
        where,
        skip,
        take,
        include: {
          type: true,
          category: true,
          configs: true,
        },
        orderBy: [{ isActive: "desc" }, { typeId: "asc" }, { name: "asc" }],
      }),
      prisma.serviceItem.count({ where }),
    ]);

    return { items, total };
  }

  public async createServiceItemWithConfig(
    createData: CreateServiceItemRequestDto,
  ): Promise<ServiceItem> {
    return await prisma.$transaction(async (tx) => {
      const createdItem = await tx.serviceItem.create({
        data: {
          itemCode: createData.itemCode,
          name: createData.name,
          categoryId: createData.categoryId ?? null,
          typeId: createData.typeId,
          basePrice: createData.basePrice ?? null,
          unit: createData.unit ?? null,
          specimen: createData.specimen ?? null,
          prepNote: createData.prepNote ?? null,
          isActive: createData.isActive ?? true,
        },
      });

      if (createData.configs && createData.configs.length > 0) {
        await tx.serviceItemConfig.createMany({
          data: createData.configs.map((cfg) => ({
            itemId: createdItem.itemId,

            configCode: cfg.configCode,
            displayName: cfg.displayName,
            inputType: cfg.inputType,
            unit: cfg.unit,
            refRange: cfg.refRange,

            metaData: cfg.metaData
              ? (cfg.metaData as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          })),
        });
      }

      return await tx.serviceItem.findUniqueOrThrow({
        where: { itemId: createdItem.itemId },
        include: {
          configs: {
            orderBy: { displayName: "asc" },
          },
          category: true,
          type: true,
        },
      });
    });
  }

  public async findServiceItemsByIds(
    itemIds: string[],
  ): Promise<Pick<ServiceItem, "itemId">[]> {
    return await prisma.serviceItem.findMany({
      where: {
        itemId: { in: itemIds },
      },
      select: {
        itemId: true,
      },
    });
  }

  public async findItemsWithConfigsByIds(
    itemIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.ServiceItemGetPayload<{ include: { configs: true } }>[]> {
    const client = tx ?? prisma;
    return await client.serviceItem.findMany({
      where: {
        itemId: { in: itemIds },
      },
      include: {
        configs: true,
      },
    });
  }

  public async findActiveItemsWithConfigsByIds(
    itemIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.ServiceItemGetPayload<{ include: { configs: true } }>[]> {
    const client = tx ?? prisma;
    return await client.serviceItem.findMany({
      where: {
        itemId: { in: itemIds },
        isActive: true,
      },
      include: {
        configs: true,
      },
    });
  }

  public async updateStatus(itemId: string, isActive: boolean) {
    return prisma.serviceItem.update({
      where: { itemId },
      data: { isActive },
      include: { configs: true, category: true, type: true },
    });
  }

  public async updateServiceItemWithConfig(
    itemId: string,
    updateData: Prisma.ServiceItemUpdateInput,
    configs?: CreateServiceItemConfigDto[],
  ): Promise<ServiceItem> {
    return await prisma.$transaction(async (tx) => {
      await tx.serviceItem.update({
        where: { itemId },
        data: updateData,
      });

      if (configs !== undefined) {
        const existingConfigs = await tx.serviceItemConfig.findMany({
          where: { itemId },
          select: { configId: true },
        });
        const existingIds = new Set(existingConfigs.map((c) => c.configId));

        const incomingIds = new Set(
          configs.map((cfg) => cfg.configId).filter(Boolean) as string[],
        );

        const idsToDelete = existingConfigs
          .filter((cfg) => !incomingIds.has(cfg.configId))
          .map((cfg) => cfg.configId);

        if (idsToDelete.length > 0) {
          await tx.serviceItemConfig.deleteMany({
            where: { configId: { in: idsToDelete } },
          });
        }

        for (const cfg of configs) {
          const payload = {
            itemId,
            configCode: cfg.configCode,
            displayName: cfg.displayName,
            inputType: cfg.inputType,
            unit: cfg.unit,
            refRange: cfg.refRange,
            metaData: cfg.metaData
              ? (cfg.metaData as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          };

          if (cfg.configId) {
            if (!existingIds.has(cfg.configId)) {
              throw new BaseError(
                400,
                "Cấu hình không thuộc dịch vụ cần cập nhật",
              );
            }
            await tx.serviceItemConfig.update({
              where: { configId: cfg.configId },
              data: payload,
            });
          } else {
            await tx.serviceItemConfig.create({
              data: payload,
            });
          }
        }
      }

      return await tx.serviceItem.findUniqueOrThrow({
        where: { itemId },
        include: {
          configs: {
            orderBy: { displayName: "asc" },
          },
          category: true,
          type: true,
        },
      });
    });
  }

  public async deleteServiceItem(itemId: string): Promise<void> {
    await prisma.serviceItem.update({
      where: { itemId },
      data: { isActive: false },
      include: {
        configs: true,
        category: true,
        type: true,
      },
    });
  }

  public async deleteByNodeType(
    typeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;
    await client.serviceItem.updateMany({
      where: { typeId },
      data: { isActive: false },
    });
  }

  public async findItemIdsByTypeId(
    typeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const client = tx || prisma;
    const rows = await client.serviceItem.findMany({
      where: { typeId },
      select: { itemId: true },
    });

    return rows.map((r) => r.itemId);
  }
}
