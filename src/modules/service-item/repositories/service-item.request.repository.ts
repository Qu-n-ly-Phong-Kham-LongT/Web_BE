import { ServiceItem } from "@prisma/client";
import { CreateServiceItemRequestDto } from "../dtos/service-item.request.dto";
import { prisma } from "../../../config/database.config";
import { Prisma } from "@prisma/client";

export class ServiceItemRepository {
  public async findByCode(code: string): Promise<ServiceItem | null> {
    return prisma.serviceItem.findUnique({
      where: { itemCode: code },
    });
  }

  public async createServiceItemWithConfig(
    createData: CreateServiceItemRequestDto
  ): Promise<ServiceItem> {
    return await prisma.$transaction(async (tx) => {
      const createdItem = await tx.serviceItem.create({
        data: {
          itemCode: createData.itemCode,
          name: createData.name,
          categoryId: createData.categoryId ?? null,
          typeId: createData.typeId,
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
            sortOrder: cfg.sortOrder,

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
}
