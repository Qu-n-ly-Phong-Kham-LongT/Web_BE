import { prisma } from "../../../config/database.config";
import { Prisma, MedicalRecord } from "@prisma/client";

export class MedicalRecordRepository {
  public async createRecord(
    data: Prisma.MedicalRecordUncheckedCreateInput
  ): Promise<MedicalRecord> {
    return await prisma.medicalRecord.create({
      data,
    });
  }

  public async findById(
    recordId: string,
    tx?: Prisma.TransactionClient
  ): Promise<MedicalRecord | null> {
    const client = tx ?? prisma;
    return await client.medicalRecord.findUnique({ where: { recordId } });
  }

  public async findExistingRecord(
    patientId: string,
    clinicId: string,
    start: Date,
    end: Date
  ): Promise<MedicalRecord | null> {
    return await prisma.medicalRecord.findFirst({
      where: {
        patientId,
        clinicId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
