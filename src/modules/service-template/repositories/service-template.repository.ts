import { Prisma, ServiceTemplate, ServiceTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export type ServiceTemplateWithDetails = ServiceTemplate & {
  details: (ServiceTemplateDetail & {
    serviceItem: {
      itemId: string;
      name: string | null;
      itemCode: string | null;
      unit: string | null;
    } | null;
  })[];
};

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const templateInclude = {
  details: {
    include: {
      serviceItem: {
        select: {
          itemId: true,
          name: true,
          itemCode: true,
          unit: true,
        },
      },
    },
  },
};

export class ServiceTemplateRepository {
  public async createServiceTemplate(
    data: {
      templateName: string;
      description?: string | null;
      isActive?: boolean;
      details: Array<{
        itemId: string;
        note?: string | null;
      }>;
    },
    tx?: TransactionClient
  ): Promise<ServiceTemplateWithDetails> {
    const client = tx || prisma;
    const result = await client.serviceTemplate.create({
      data: {
        templateName: data.templateName,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        details: {
          create: data.details.map((detail) => ({
            itemId: detail.itemId,
            note: detail.note ?? null,
          })),
        },
      },
      include: templateInclude,
    });

    return result as ServiceTemplateWithDetails;
  }

  public async findServiceTemplateById(
    id: string,
    tx?: TransactionClient
  ): Promise<ServiceTemplateWithDetails | null> {
    const client = tx || prisma;
    return await client.serviceTemplate.findUnique({
      where: { templateId: id },
      include: templateInclude,
    });
  }

  public async findServiceTemplates(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<{ templates: ServiceTemplateWithDetails[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const where: Prisma.ServiceTemplateWhereInput = search
      ? {
          OR: [
            { templateName: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [templates, totalItems] = await Promise.all([
      prisma.serviceTemplate.findMany({
        where,
        skip,
        take: size,
        orderBy: { templateName: "asc" },
        include: templateInclude,
      }),
      prisma.serviceTemplate.count({ where }),
    ]);

    return { templates: templates as ServiceTemplateWithDetails[], totalItems };
  }

  public async updateTemplateHeader(
    id: string,
    data: Prisma.ServiceTemplateUpdateInput,
    tx?: TransactionClient
  ): Promise<ServiceTemplate> {
    const client = tx || prisma;
    // Service đã filter, nhận PrismaUpdateInput và update trực tiếp
    return await client.serviceTemplate.update({
      where: { templateId: id },
      data: data,
    });
  }

  public async deleteServiceTemplate(
    id: string,
    tx?: TransactionClient
  ): Promise<ServiceTemplate> {
    const client = tx || prisma;

    await client.serviceTemplateDetail.deleteMany({
      where: { templateId: id },
    });
    
    return await client.serviceTemplate.delete({
      where: { templateId: id },
    });
  }
}

