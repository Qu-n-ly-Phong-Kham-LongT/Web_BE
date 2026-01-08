import { Prisma, PrescriptionTemplate, PrescriptionTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export type PrescriptionTemplateWithDetails = PrescriptionTemplate & {
  details: (PrescriptionTemplateDetail & {
    medicine: {
      medicineId: string;
      medicineName: string | null;
      medicineCode: string | null;
      baseUnit: string | null;
    } | null;
  })[];
  creator: {
    userId: string;
    fullName: string;
  } | null;
};

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const templateInclude = {
  details: {
    include: {
      medicine: {
        select: {
          medicineId: true,
          medicineName: true,
          medicineCode: true,
          baseUnit: true,
        },
      },
    },
  },
  creator: {
    select: {
      userId: true,
      fullName: true,
    },
  },
};

export class PrescriptionTemplateRepository {
  public async createPrescriptionTemplate(
    data: {
      templateName: string;
      description?: string | null;
      details: Array<{
        medicineId: string;
        defaultFrequency?: number | null;
        defaultQuantityPerTime?: number | null;
        daysToTake?: number | null;
        defaultRoute?: string | null;
        defaultTiming?: string | null;
      }>;
    },
    createdBy?: string,
    tx?: TransactionClient
  ): Promise<PrescriptionTemplateWithDetails> {
    const client = tx || prisma;
    const result = await client.prescriptionTemplate.create({
      data: {
        templateName: data.templateName,
        description: data.description ?? null,
        createdBy: createdBy,
        details: {
          create: data.details.map((detail) => ({
            medicineId: detail.medicineId,
            defaultFrequency: detail.defaultFrequency ?? null,
            defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
            daysToTake: detail.daysToTake ?? null,
            defaultRoute: detail.defaultRoute ?? null,
            defaultTiming: detail.defaultTiming ?? null,
          })),
        },
      },
      include: templateInclude,
    });

    return result as PrescriptionTemplateWithDetails;
  }

  public async findPrescriptionTemplateById(
    id: string,
    tx?: TransactionClient
  ): Promise<PrescriptionTemplateWithDetails | null> {
    const client = tx || prisma;
    return await client.prescriptionTemplate.findUnique({
      where: { templateId: id },
      include: templateInclude,
    });
  }

  public async findPrescriptionTemplates(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<{ templates: PrescriptionTemplateWithDetails[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const where: Prisma.PrescriptionTemplateWhereInput = search
      ? {
          OR: [
            { templateName: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [templates, totalItems] = await Promise.all([
      prisma.prescriptionTemplate.findMany({
        where,
        skip,
        take: size,
        orderBy: { templateName: "asc" },
        include: templateInclude,
      }),
      prisma.prescriptionTemplate.count({ where }),
    ]);

    return { templates: templates as PrescriptionTemplateWithDetails[], totalItems };
  }

  public async updateTemplateHeader(
    id: string,
    data: Prisma.PrescriptionTemplateUpdateInput,
    tx?: TransactionClient
  ): Promise<PrescriptionTemplate> {
    const client = tx || prisma;
    // Service đã filter, nhận PrismaUpdateInput và update trực tiếp
    return await client.prescriptionTemplate.update({
      where: { templateId: id },
      data: data,
    });
  }

  public async deletePrescriptionTemplate(
    id: string,
    tx?: TransactionClient
  ): Promise<PrescriptionTemplate> {
    const client = tx || prisma;

    await client.prescriptionTemplateDetail.deleteMany({
      where: { templateId: id },
    });
    
    return await client.prescriptionTemplate.delete({
      where: { templateId: id },
    });
  }
}
