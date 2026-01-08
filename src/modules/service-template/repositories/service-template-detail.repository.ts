import { Prisma, ServiceTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class ServiceTemplateDetailRepository {
  public async createTemplateDetail(
    templateId: string,
    data: {
      itemId: string;
      note?: string | null;
    },
    tx?: TransactionClient
  ): Promise<ServiceTemplateDetail> {
    const client = tx || prisma;
    return await client.serviceTemplateDetail.create({
      data: {
        templateId: templateId,
        itemId: data.itemId,
        note: data.note ?? null,
      },
    });
  }

  public async createManyTemplateDetails(
    templateId: string,
    details: Array<{
      itemId: string;
      note?: string | null;
    }>,
    tx?: TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || prisma;
    return await client.serviceTemplateDetail.createMany({
      data: details.map((detail) => ({
        templateId: templateId,
        itemId: detail.itemId,
        note: detail.note ?? null,
      })),
    });
  }

  public async findTemplateDetailById(
    templateDetailId: string,
    tx?: TransactionClient
  ): Promise<ServiceTemplateDetail | null> {
    const client = tx || prisma;
    return await client.serviceTemplateDetail.findUnique({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async findTemplateDetailsByTemplateId(
    templateId: string,
    tx?: TransactionClient
  ): Promise<ServiceTemplateDetail[]> {
    const client = tx || prisma;
    return await client.serviceTemplateDetail.findMany({
      where: { templateId: templateId },
    });
  }

  public async updateTemplateDetail(
    templateDetailId: string,
    data: {
      itemId?: string;
      note?: string | null;
    },
    tx?: TransactionClient
  ): Promise<ServiceTemplateDetail> {
    const client = tx || prisma;
    const updateData: Prisma.ServiceTemplateDetailUpdateInput = {};

    if (data.itemId !== undefined) {
      updateData.serviceItem = { connect: { itemId: data.itemId } };
    }
    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    return await client.serviceTemplateDetail.update({
      where: { templateDetailId: templateDetailId },
      data: updateData,
    });
  }

  public async deleteTemplateDetail(
    templateDetailId: string,
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    await client.serviceTemplateDetail.delete({
      where: { templateDetailId: templateDetailId },
    });
  }

  public async deleteTemplateDetailsByTemplateId(
    templateId: string,
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    await client.serviceTemplateDetail.deleteMany({
      where: { templateId: templateId },
    });
  }

  public async deleteTemplateDetailsByIds(
    templateDetailIds: string[],
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    await client.serviceTemplateDetail.deleteMany({
      where: { templateDetailId: { in: templateDetailIds } },
    });
  }
}

