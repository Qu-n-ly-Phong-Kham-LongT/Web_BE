import { Prisma, PrescriptionTemplate, PrescriptionTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePrescriptionTemplateRequestDto } from "../dtos/create-prescription-template.request.dto";

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

export class PrescriptionTemplateRepository {
  public async createPrescriptionTemplate(
    data: CreatePrescriptionTemplateRequestDto,
    createdBy?: string
  ): Promise<PrescriptionTemplateWithDetails> {
    // Use Prisma Nested Writes - single query, better performance
    const result = await prisma.prescriptionTemplate.create({
      data: {
        templateName: data.templateName,
        description: data.description ?? null,
        createdBy: createdBy,
        details: {
          create: data.details.map((detail) => ({
            medicineId: detail.medicineId,
            defaultFrequency: detail.defaultFrequency ?? null,
            defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
            defaultRoute: detail.defaultRoute ?? null,
            defaultTiming: detail.defaultTiming ?? null,
          })),
        },
      },
      include: {
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
      },
    });

    return result as PrescriptionTemplateWithDetails;
  }

  public async findPrescriptionTemplateById(
    id: string
  ): Promise<PrescriptionTemplateWithDetails | null> {
    return await prisma.prescriptionTemplate.findFirst({
      where: {
        templateId: id,
      },
      include: {
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
      },
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
        include: {
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
        },
      }),
      prisma.prescriptionTemplate.count({ where }),
    ]);

    return { templates: templates as PrescriptionTemplateWithDetails[], totalItems };
  }

  public async updatePrescriptionTemplate(
    id: string,
    data: {
      templateName?: string;
      description?: string | null;
      details?: Array<{
        templateDetailId?: string;
        medicineId: string;
        defaultFrequency?: number | null;
        defaultQuantityPerTime?: number | null;
        defaultRoute?: string | null;
        defaultTiming?: string | null;
      }>;
    }
  ): Promise<PrescriptionTemplateWithDetails | null> {
    // Step 1: Get existing template with details (Snapshot)
    const existingTemplate = await prisma.prescriptionTemplate.findFirst({
      where: {
        templateId: id,
      },
      include: {
        details: true,
      },
    });

    if (!existingTemplate) {
      return null;
    }

    // Step 2 & 3: Classify data and determine what to delete
    const existingDetailIds = existingTemplate.details.map((d) => d.templateDetailId);
    const detailsToUpdate: Array<{ templateDetailId: string; medicineId: string; defaultFrequency?: number | null; defaultQuantityPerTime?: number | null; defaultRoute?: string | null; defaultTiming?: string | null }> = [];
    const detailsToCreate: Array<{ medicineId: string; defaultFrequency?: number | null; defaultQuantityPerTime?: number | null; defaultRoute?: string | null; defaultTiming?: string | null }> = [];

    if (data.details !== undefined) {
      for (const detail of data.details) {
        if (detail.templateDetailId && existingDetailIds.includes(detail.templateDetailId)) {
          // Group UPDATE: has templateDetailId and exists in DB
          detailsToUpdate.push({
            templateDetailId: detail.templateDetailId,
            medicineId: detail.medicineId,
            defaultFrequency: detail.defaultFrequency ?? null,
            defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
            defaultRoute: detail.defaultRoute ?? null,
            defaultTiming: detail.defaultTiming ?? null,
          });
        } else {
          // Group CREATE: no templateDetailId or doesn't exist in DB
          detailsToCreate.push({
            medicineId: detail.medicineId,
            defaultFrequency: detail.defaultFrequency ?? null,
            defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
            defaultRoute: detail.defaultRoute ?? null,
            defaultTiming: detail.defaultTiming ?? null,
          });
        }
      }

      // Determine details to DELETE: IDs in DB but not in request
      const newDetailIds = data.details.filter((d) => d.templateDetailId).map((d) => d.templateDetailId!);
      const detailsToDelete = existingDetailIds.filter((id) => !newDetailIds.includes(id));

      // Step 4: Execute transaction with proper order
      return await prisma.$transaction(async (tx) => {
        // 1. Update Header (templateName, description)
        const updateHeaderData: Prisma.PrescriptionTemplateUpdateInput = {};
        if (data.templateName !== undefined) {
          updateHeaderData.templateName = data.templateName;
        }
        if (data.description !== undefined) {
          updateHeaderData.description = data.description ?? null;
        }

        if (Object.keys(updateHeaderData).length > 0) {
          await tx.prescriptionTemplate.update({
            where: { templateId: id },
            data: updateHeaderData,
          });
        }

        // 2. Delete details that are no longer in request
        if (detailsToDelete.length > 0) {
          await tx.prescriptionTemplateDetail.deleteMany({
            where: { templateDetailId: { in: detailsToDelete } },
          });
        }

        // 3. Create new details
        if (detailsToCreate.length > 0) {
          await tx.prescriptionTemplateDetail.createMany({
            data: detailsToCreate.map((detail) => ({
              templateId: id,
              medicineId: detail.medicineId,
              defaultFrequency: detail.defaultFrequency ?? null,
              defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
              defaultRoute: detail.defaultRoute ?? null,
              defaultTiming: detail.defaultTiming ?? null,
            })),
          });
        }

        // 4. Update existing details (must update one by one as Prisma doesn't support updateMany with different values)
        if (detailsToUpdate.length > 0) {
          await Promise.all(
            detailsToUpdate.map((detail) =>
              tx.prescriptionTemplateDetail.update({
                where: { templateDetailId: detail.templateDetailId },
                data: {
                  medicineId: detail.medicineId,
                  defaultFrequency: detail.defaultFrequency,
                  defaultQuantityPerTime: detail.defaultQuantityPerTime,
                  defaultRoute: detail.defaultRoute,
                  defaultTiming: detail.defaultTiming,
                },
              })
            )
          );
        }

        // Return updated template with all relations
        const updatedTemplate = await tx.prescriptionTemplate.findUnique({
          where: { templateId: id },
          include: {
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
          },
        });

        if (!updatedTemplate) {
          throw new Error("Failed to retrieve updated prescription template");
        }

        return updatedTemplate as PrescriptionTemplateWithDetails;
      });
    } else {
      // Only update header, no details change
      const updateHeaderData: Prisma.PrescriptionTemplateUpdateInput = {};
      if (data.templateName !== undefined) {
        updateHeaderData.templateName = data.templateName;
      }
      if (data.description !== undefined) {
        updateHeaderData.description = data.description ?? null;
      }

      if (Object.keys(updateHeaderData).length === 0) {
        // No changes, return existing
        return await this.findPrescriptionTemplateById(id);
      }

      const result = await prisma.prescriptionTemplate.update({
        where: { templateId: id },
        data: updateHeaderData,
        include: {
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
        },
      });

      return result as PrescriptionTemplateWithDetails;
    }
  }

}

