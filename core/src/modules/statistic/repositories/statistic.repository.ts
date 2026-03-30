import { prisma } from "../../../config/database.config";

export class StatisticRepository {
  public async countRecords(from: Date, to: Date, clinicId?: string) {
    return await prisma.medicalRecord.count({
      where: {
        isDeleted: false,
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
      },
    });
  }

  public async recordsInRange(from: Date, to: Date, clinicId?: string) {
    return await prisma.medicalRecord.findMany({
      where: {
        isDeleted: false,
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
        isDeleted: false,
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
        isDeleted: false,
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
          isDeleted: false,
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
          isDeleted: false,
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
        medicalRecord: {
          isDeleted: false,
          ...(clinicId ? { clinicId } : {}),
        },
        isDispensed: true,
        dispensedAt: { gte: from, lt: to },
      },
      select: {
        dispensedAt: true,
        totalPrice: true,
        details: {
          select: {
            quantity: true,
            totalPrice: true,
            appliedExportPrice: true,
            appliedImportPrice: true,
            medicine: {
              select: {
                medicineId: true,
                medicineName: true,
                sellPrice: true,
                importPrice: true,
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
        isDeleted: false,
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: from, lt: to },
      },
      select: {
        createdAt: true,
        consultationFee: true,
      },
    });
  }
  public async findDispensedPrescriptionProfitsInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        medicalRecord: {
          isDeleted: false,
          ...(clinicId ? { clinicId } : {}),
        },
        isDispensed: true,
        dispensedAt: { gte: from, lt: to },
      },
      select: {
        dispensedAt: true,
        details: {
          select: {
            quantity: true,
            appliedExportPrice: true,
            appliedImportPrice: true,
            medicine: {
              select: {
                sellPrice: true,
                importPrice: true,
              },
            },
          },
        },
      },
    });

    return prescriptions.map((p) => ({
      dispensedAt: p.dispensedAt,
      profit: (p.details ?? []).reduce((sum, d) => {
        const qty = d.quantity ? Number(d.quantity) : 0;
        const sell = d.appliedExportPrice
          ? Number(d.appliedExportPrice)
          : d.medicine?.sellPrice
            ? Number(d.medicine.sellPrice)
            : 0;
        const cost = d.appliedImportPrice
          ? Number(d.appliedImportPrice)
          : d.medicine?.importPrice
            ? Number(d.medicine.importPrice)
            : 0;
        return sum + (sell - cost) * qty;
      }, 0),
    }));
  }

  public async findDispensedPrescriptionTotalsInRange(
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return await prisma.prescription.findMany({
      where: {
        medicalRecord: {
          isDeleted: false,
          ...(clinicId ? { clinicId } : {}),
        },
        isDispensed: true,
        dispensedAt: { gte: from, lt: to },
      },
      select: {
        dispensedAt: true,
        totalPrice: true,
      },
    });
  }
}

