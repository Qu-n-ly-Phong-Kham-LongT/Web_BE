import { Prisma, ServiceItem } from "@prisma/client";
import { CreateServiceItemRequestDto } from "../dtos/service-item.request.dto";
import { prisma } from "../../../config/database.config";
import { includes } from "lodash";

export class ServiceItemRepository {
  public async findByCode(code: string): Promise<ServiceItem | null> {
    return prisma.serviceItem.findUnique({
      where: { itemCode: code },
    });
  }

  public async findById(itemId: string) {
    return prisma.serviceItem.findUnique({
      where: { itemId },
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
  }) {
    const { skip, take, search, typeId, categoryId } = params;

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
        { isActive: true },
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
        orderBy: [{ typeId: "asc" }, { name: "asc" }],
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
}
