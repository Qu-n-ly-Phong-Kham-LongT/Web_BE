import { ClinicalExamination, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

const INHERITED_HISTORY_LOOKBACK = 20;

export function pickInheritedPastMedicalHistory(
  histories: Array<string | null>,
): string | null {
  return histories.find((history) => history?.trim()) ?? null;
}

export class ClinicalExaminationRepository {
  public async findInheritedPastMedicalHistory(
    patientId: string,
    clinicId: string,
    createdBefore: Date,
  ): Promise<string | null> {
    const earlierExams = await prisma.clinicalExamination.findMany({
      where: {
        AND: [
          { pastMedicalHistory: { not: null } },
          { NOT: { pastMedicalHistory: "" } },
        ],
        medicalRecord: {
          patientId,
          clinicId,
          isDeleted: false,
          createdAt: { lt: createdBefore },
        },
      },
      orderBy: { medicalRecord: { createdAt: "desc" } },
      select: { pastMedicalHistory: true },
      take: INHERITED_HISTORY_LOOKBACK,
    });
    return pickInheritedPastMedicalHistory(
      earlierExams.map((exam) => exam.pastMedicalHistory),
    );
  }

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
