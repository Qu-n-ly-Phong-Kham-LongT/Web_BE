import { prisma } from "../../config/database.config";

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
}
