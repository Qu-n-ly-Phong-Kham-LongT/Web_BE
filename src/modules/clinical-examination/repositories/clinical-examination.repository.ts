import { ClinicalExamination, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class ClinicalExaminationRepository {
  public async createExamination(
    data: Prisma.ClinicalExaminationUncheckedCreateInput
  ): Promise<ClinicalExamination> {
    return await prisma.clinicalExamination.create({ data });
  }

  public async findByRecordId(recordId: string): Promise<ClinicalExamination | null> {
    return await prisma.clinicalExamination.findUnique({ where: { recordId } });
  }

  public async updateByRecordId(
    recordId: string,
    data: Prisma.ClinicalExaminationUncheckedUpdateInput
  ): Promise<ClinicalExamination> {
    return await prisma.clinicalExamination.update({
      where: { recordId },
      data,
    });
  }
}
