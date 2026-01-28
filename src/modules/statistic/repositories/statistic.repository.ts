import { prisma } from "../../../config/database.config";

export class StatisticRepository {
  public async countRecords(from: Date, to: Date, clinicId?: string) {
    return await prisma.medicalRecord.count({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
      },
    });
  }

  public async recordsInRange(from: Date, to: Date, clinicId?: string) {
    return await prisma.medicalRecord.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
      },
      select: { createdAt: true },
    });
  }

  public async countNewPatientsWithoutRecordsInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return await prisma.patient.count({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
        medicalRecords: { none: {} },
      },
    });
  }

  public async patientsWithoutRecordsInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return await prisma.patient.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
        medicalRecords: { none: {} },
      },
      select: { createdAt: true },
    });
  }

  public async recentPatientsToday(clinicId?: string, limit: number = 5) {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const take = Math.max(limit * 2, 10);
    const [records, newPatients] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: {
          ...(clinicId ? { clinicId } : {}),
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { createdAt: "desc" },
        take: take,
        select: {
          createdAt: true,
          patient: {
            select: {
              patientId: true,
              fullName: true,
              dob: true,
            },
          },
        },
      }),

      prisma.patient.findMany({
        where: {
          ...(clinicId ? { clinicId } : {}),
          createdAt: { gte: startOfDay, lt: endOfDay },
          medicalRecords: { none: {} },
        },
        select: {
          createdAt: true,
          patientId: true,
          fullName: true,
          dob: true,
        },
        orderBy: { createdAt: "desc" },
        take: take,
      }),
    ]);

    return { records, newPatients };
  }

  public async findDispensedPrescriptionsInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return await prisma.prescription.findMany({
      where: {
        ...(clinicId ? { medicalRecord: { clinicId } } : {}),
        isDispensed: true,
        dispensedAt: { gte: from, lt: to },
      },
      select: {
        dispensedAt: true,
        details: {
          select: {
            quantity: true,
            totalPrice: true,
            appliedExportPrice: true,
            medicine: {
              select: {
                medicineId: true,
                medicineName: true,
              },
            },
          },
        },
      },
    });
  }

  public async findConsultationFeesInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return await prisma.medicalRecord.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
      },
      select: {
        createdAt: true,
        consultationFee: true,
      },
    });
  }
}
