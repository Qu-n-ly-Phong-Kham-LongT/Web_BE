import { Prisma } from "@prisma/client";

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
}
