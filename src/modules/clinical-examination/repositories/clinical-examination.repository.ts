import { ClinicalExamination, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class ClinicalExaminationRepository {
  public async createExamination(
    data: Prisma.ClinicalExaminationUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<ClinicalExamination> {
    const client = tx || prisma;
    return await client.clinicalExamination.create({ data });
  }

  public async findByRecordId(
    recordId: string,
    tx?: Prisma.TransactionClient
  ): Promise<ClinicalExamination | null> {
    const client = tx || prisma;
    return await client.clinicalExamination.findUnique({ where: { recordId } });
  }

  public async updateByRecordId(
    recordId: string,
    data: Prisma.ClinicalExaminationUncheckedUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<ClinicalExamination> {
    const client = tx || prisma;
    return await client.clinicalExamination.update({
      where: { recordId },
      data,
    });
  }
}
