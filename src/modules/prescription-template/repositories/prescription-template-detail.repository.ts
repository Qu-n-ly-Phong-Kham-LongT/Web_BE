import { Prisma, PrescriptionTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class PrescriptionTemplateDetailRepository {
  public async createTemplateDetail(
    templateId: string,
    data: {
      medicineId: string;
      defaultFrequency?: number | null;
      defaultQuantityPerTime?: number | null;
      defaultRoute?: string | null;
      defaultTiming?: string | null;
    }
  ): Promise<PrescriptionTemplateDetail> {
    return await prisma.prescriptionTemplateDetail.create({
      data: {
        templateId: templateId,
        medicineId: data.medicineId,
        defaultFrequency: data.defaultFrequency ?? null,
        defaultQuantityPerTime: data.defaultQuantityPerTime ?? null,
        defaultRoute: data.defaultRoute ?? null,
        defaultTiming: data.defaultTiming ?? null,
      },
    });
  }

  public async createManyTemplateDetails(
    templateId: string,
    details: Array<{
      medicineId: string;
      defaultFrequency?: number | null;
      defaultQuantityPerTime?: number | null;
      defaultRoute?: string | null;
      defaultTiming?: string | null;
    }>
  ): Promise<{ count: number }> {
    return await prisma.prescriptionTemplateDetail.createMany({
      data: details.map((detail) => ({
        templateId: templateId,
        medicineId: detail.medicineId,
        defaultFrequency: detail.defaultFrequency ?? null,
        defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
        defaultRoute: detail.defaultRoute ?? null,
        defaultTiming: detail.defaultTiming ?? null,
      })),
    });
  }

  public async findTemplateDetailById(templateDetailId: string): Promise<PrescriptionTemplateDetail | null> {
    return await prisma.prescriptionTemplateDetail.findUnique({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async findTemplateDetailsByTemplateId(templateId: string): Promise<PrescriptionTemplateDetail[]> {
    return await prisma.prescriptionTemplateDetail.findMany({
      where: { templateId: templateId },
    });
  }

  public async updateTemplateDetail(
    templateDetailId: string,
    data: {
      medicineId?: string;
      defaultFrequency?: number | null;
      defaultQuantityPerTime?: number | null;
      defaultRoute?: string | null;
      defaultTiming?: string | null;
    }
  ): Promise<PrescriptionTemplateDetail> {
    const updateData: Prisma.PrescriptionTemplateDetailUpdateInput = {};

    if (data.medicineId !== undefined) {
      updateData.medicineId = data.medicineId;
    }
    if (data.defaultFrequency !== undefined) {
      updateData.defaultFrequency = data.defaultFrequency;
    }
    if (data.defaultQuantityPerTime !== undefined) {
      updateData.defaultQuantityPerTime = data.defaultQuantityPerTime;
    }
    if (data.defaultRoute !== undefined) {
      updateData.defaultRoute = data.defaultRoute;
    }
    if (data.defaultTiming !== undefined) {
      updateData.defaultTiming = data.defaultTiming;
    }

    return await prisma.prescriptionTemplateDetail.update({
      where: { templateDetailId: templateDetailId },
      data: updateData,
    });
  }

  public async deleteTemplateDetail(templateDetailId: string): Promise<void> {
    await prisma.prescriptionTemplateDetail.delete({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async deleteTemplateDetails(templateId: string): Promise<void> {
    await prisma.prescriptionTemplateDetail.deleteMany({
      where: { templateId: templateId },
    });
  }

  public async deleteTemplateDetailsByIds(templateDetailIds: string[]): Promise<void> {
    await prisma.prescriptionTemplateDetail.deleteMany({
      where: { templateDetailId: { in: templateDetailIds } },
    });
  }
}


