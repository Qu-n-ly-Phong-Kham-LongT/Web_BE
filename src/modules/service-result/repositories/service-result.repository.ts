import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class ServiceResultRepository {
  public async findByDetailId(
    detailId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return await client.serviceResult.findMany({
      where: { detailId },
      include: { serviceItemConfig: true },
    });
  }

  public async findByDetailAndConfigs(
    detailId: string,
    configIds: string[],
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return await client.serviceResult.findMany({
      where: {
        detailId,
        configId: { in: configIds },
      },
    });
  }

  public async createMany(
    results: Prisma.ServiceResultUncheckedCreateInput[],
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    const created: Prisma.ServiceResultGetPayload<{
      include: { serviceItemConfig: true };
    }>[] = [];
    for (const result of results) {
      const item = await client.serviceResult.create({
        data: result,
        include: { serviceItemConfig: true },
      });
      created.push(item);
    }
    return created;
  }

  public async updateById(
    resultId: string,
    data: Prisma.ServiceResultUpdateInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return await client.serviceResult.update({
      where: { resultId },
      data,
      include: { serviceItemConfig: true },
    });
  }
}
