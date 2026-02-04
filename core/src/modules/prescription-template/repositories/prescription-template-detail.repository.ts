import { Prisma, PrescriptionTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class PrescriptionTemplateDetailRepository {
  public async createTemplateDetail(
    templateId: string,
    data: {
      medicineId: string;
      defaultFrequency?: number | null;
      defaultQuantityPerTime?: number | null;
      defaultRoute?: string | null;
      defaultTiming?: string | null;
    },
    tx?: TransactionClient,
  ): Promise<PrescriptionTemplateDetail> {
    const client = tx || prisma;
    return await client.prescriptionTemplateDetail.create({
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
    }>,
    tx?: TransactionClient,
  ): Promise<{ count: number }> {
    const client = tx || prisma;
    return await client.prescriptionTemplateDetail.createMany({
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

  public async findTemplateDetailById(
    templateDetailId: string,
    tx?: TransactionClient,
  ): Promise<PrescriptionTemplateDetail | null> {
    const client = tx || prisma;
    return await client.prescriptionTemplateDetail.findUnique({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async findTemplateDetailsByTemplateId(
    templateId: string,
    tx?: TransactionClient,
  ): Promise<PrescriptionTemplateDetail[]> {
    const client = tx || prisma;
    return await client.prescriptionTemplateDetail.findMany({
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
    },
    tx?: TransactionClient,
  ): Promise<PrescriptionTemplateDetail> {
    const client = tx || prisma;
    const updateData: Prisma.PrescriptionTemplateDetailUpdateInput = {};

    if (data.medicineId !== undefined) {
      updateData.medicine = { connect: { medicineId: data.medicineId } };
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

    return await client.prescriptionTemplateDetail.update({
      where: { templateDetailId: templateDetailId },
      data: updateData,
    });
  }

  public async deleteTemplateDetail(
    templateDetailId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;
    await client.prescriptionTemplateDetail.delete({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async deleteTemplateDetailsByTemplateId(
    templateId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;
    await client.prescriptionTemplateDetail.deleteMany({
      where: { templateId: templateId },
    });
  }

  public async deleteTemplateDetailsByIds(
    templateDetailIds: string[],
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;
    await client.prescriptionTemplateDetail.deleteMany({
      where: { templateDetailId: { in: templateDetailIds } },
    });
  }

  public async deleteDetailsByMedicineId(
    medicineId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;
    await client.prescriptionTemplateDetail.deleteMany({
      where: { medicineId },
    });
  }
}
