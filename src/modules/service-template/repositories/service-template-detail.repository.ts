import { Prisma, ServiceTemplateDetail } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { SelectedConfigsDto } from "../../service-request/dtos/service-request.request.dto";

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
      selectedConfigs?: SelectedConfigsDto[];
    },
    tx?: TransactionClient
  ): Promise<ServiceTemplateDetail> {
    const client = tx || prisma;
    return await client.serviceTemplateDetail.create({
      data: {
        templateId: templateId,
        itemId: data.itemId,
        note: data.note ?? null,
        configSelections: data.selectedConfigs
          ? JSON.parse(JSON.stringify(data.selectedConfigs))
          : null,
      },
    });
  }

  public async createManyTemplateDetails(
    templateId: string,
    details: Array<{
      itemId: string;
      note?: string | null;
      selectedConfigs?: SelectedConfigsDto[];
    }>,
    tx?: TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || prisma;

    const dataToInsert = details.map((detail) => ({
      templateId: templateId,
      itemId: detail.itemId,
      note: detail.note ?? null,
      configSelections:
        detail.selectedConfigs !== undefined
          ? (detail.selectedConfigs as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    }));

    return await client.serviceTemplateDetail.createMany({
      data: dataToInsert,
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
