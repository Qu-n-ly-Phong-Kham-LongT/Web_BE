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
            clinic: true,
            doctor: true,
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
          select: {
            recordId: true,
            recordCode: true,
            createdAt: true,
            diagnoses: true,
          },
        },
        details: {
          include: { medicine: true },
        },
      },
    });
  }

  public async getDispenseData(
    prescriptionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    return await client.prescription.findUnique({
      where: { prescriptionId },
      include: {
        medicalRecord: { select: { clinicId: true } },
        details: {
          include: {
            medicine: {
              select: {
                medicineId: true,
                medicineName: true,
                activeIngredient: true,
                isInsuranceCovered: true,
                totalQuantity: true,
                baseUnit: true,
                insurancePrice: true,
                sellPrice: true,
              },
            },
          },
        },
      },
    });
  }

  public async findPatientsWithPrescriptionsByDate(params: {
    from: Date;
    to: Date;
    clinicId?: string;
    page: number;
    size: number;
    isDispensed?: boolean;
    fullName?: string;
  }) {
    const { from, to, clinicId, page, size, isDispensed, fullName } = params;

    const medicalRecordWhere: Prisma.MedicalRecordWhereInput = {};
    if (clinicId) {
      medicalRecordWhere.clinicId = clinicId;
    }
    if (fullName) {
      medicalRecordWhere.patient = {
        fullName: { contains: fullName, mode: "insensitive" },
      };
    }

    const where: Prisma.PrescriptionWhereInput = {
      createdAt: { gte: from, lte: to },
      ...(Object.keys(medicalRecordWhere).length
        ? { medicalRecord: medicalRecordWhere }
        : {}),
      ...(isDispensed === undefined ? {} : { isDispensed }),
    };

    const skip = (page - 1) * size;

    const [items, totalItems] = await Promise.all([
      prisma.prescription.findMany({
        where,
        orderBy: [
          { isDispensed: "desc" },
          { dispensedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: size,
        include: {
          medicalRecord: {
            select: {
              recordId: true,
              recordCode: true,
              createdAt: true,
              patient: {
                select: {
                  patientId: true,
                  patientCode: true,
                  fullName: true,
                  gender: true,
                  dob: true,
                  phone: true,
                },
              },
            },
          },
          details: {
            include: { medicine: true },
          },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return { items, totalItems };
  }

  public async markDispensed(
    prescriptionId: string,
    userId: string,
    totalPrice: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.prescription.update({
      where: { prescriptionId },
      data: {
        isDispensed: true,
        dispensedAt: new Date(),
        dispensedBy: userId,
        totalPrice: new Prisma.Decimal(totalPrice),
      },
    });
  }

  public async createInventoryLogs(
    data: Prisma.InventoryLogCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    return await tx.inventoryLog.createMany({ data });
  }
}
