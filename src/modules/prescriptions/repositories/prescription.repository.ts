import { PrescriptionStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export class PrescriptionRepository {
  public async upsertPrescription(
    recordId: string,
    totalPrice: number,
    note: string | null,
    tx: Prisma.TransactionClient,
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

  public async findByPatientId(params: {
    patientId: string;
    clinicId?: string;
    fromDate?: Date;
    toDate?: Date;
    status?: PrescriptionStatus;
    sort?: "asc" | "desc";
  }) {
    const { patientId, clinicId, fromDate, toDate, status, sort } = params;

    const recordDateFilter: Prisma.DateTimeNullableFilter = {};
    if (fromDate) recordDateFilter.gte = fromDate;
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      recordDateFilter.lte = endOfDay;
    }

    const where: Prisma.PrescriptionWhereInput = {
      ...(status ? { status } : {}),
      medicalRecord: {
        patientId,
        ...(clinicId ? { clinicId } : {}),
        ...(fromDate || toDate ? { createdAt: recordDateFilter } : {}),
      },
    };

    return await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: sort ?? "desc" },
      include: {
        medicalRecord: {
          select: { recordId: true, recordCode: true, createdAt: true, diagnoses: true },
        },
        details: {
          include: { medicine: true },
        },
      },
    });
  }
}
