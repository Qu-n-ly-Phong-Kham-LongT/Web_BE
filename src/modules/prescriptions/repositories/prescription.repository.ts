import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config"

export class PrescriptionRepository {
  public async upsertPrescription(
    recordId: string,
    totalPrice: number,
    note: string | null,
    tx: Prisma.TransactionClient
  ) {
    return await tx.prescription.upsert({
      where: { recordId },
      update: {
        totalPrice: new Prisma.Decimal(totalPrice),
        note: note ?? null,
      },
      create: {
        recordId,
        totalPrice: new Prisma.Decimal(totalPrice),
        note: note ?? null,
      },
    });
  }

  public async getPrintData(prescriptionId: string) {
    return await prisma.prescription.findUnique({
      where: { prescriptionId },
      include: {
        medicalRecord: {
          include: {
            patient: true,
            followUp: true,
          },
        },
        details: {
          include: {
            medicine: true,
          },
        },
      },
    });
  }
}
