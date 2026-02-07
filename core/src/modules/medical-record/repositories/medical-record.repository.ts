import { prisma } from "../../../config/database.config";
import { Prisma, MedicalRecord } from "@prisma/client";

export class MedicalRecordRepository {
  public async createRecord(
    data: Prisma.MedicalRecordUncheckedCreateInput,
  ): Promise<MedicalRecord> {
    return await prisma.medicalRecord.create({
      data,
    });
  }

  public async findById(
    recordId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MedicalRecord | null> {
    const client = tx ?? prisma;
    return await client.medicalRecord.findUnique({
      where: { recordId, isDeleted: false },
    });
  }

  public async findExistingRecord(
    patientId: string,
    clinicId: string,
    start: Date,
    end: Date,
  ): Promise<MedicalRecord | null> {
    return await prisma.medicalRecord.findFirst({
      where: {
        patientId,
        clinicId,
        isDeleted: false,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  public async findAll(params: {
    skip: number;
    take: number;
    search?: string;
    clinicId?: string; // Thay cho categoryId
    doctorId?: string; // Thay cho typeId
    patientId?: string; // Lọc theo bệnh nhân cụ thể
  }) {
    const { skip, take, search, clinicId, doctorId, patientId } = params;

    const where: Prisma.MedicalRecordWhereInput = {
      isDeleted: false,
      AND: [
        search
          ? {
              OR: [
                // 1. Tìm theo mã hồ sơ bệnh án
                { recordCode: { contains: search, mode: "insensitive" } },
                // 2. Tìm theo thông tin bệnh nhân (Relation)
                {
                  patient: {
                    OR: [
                      { fullName: { contains: search, mode: "insensitive" } },
                      {
                        patientCode: { contains: search, mode: "insensitive" },
                      },
                      { phone: { contains: search, mode: "insensitive" } },
                      {
                        identityCard: { contains: search, mode: "insensitive" },
                      },
                    ],
                  },
                },
              ],
            }
          : {},
        clinicId ? { clinicId } : {},
        doctorId ? { doctorId } : {},
        patientId ? { patientId } : {},
      ],
    };

    // Thực hiện truy vấn (kèm đếm tổng số bản ghi để phân trang)
    const [data, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" }, // Mặc định hồ sơ mới nhất lên đầu
        include: {
          patient: true, // Lấy kèm thông tin bệnh nhân
          doctor: {
            // Lấy kèm tên bác sĩ
            select: {
              userId: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  public async calculateConsultationFees(
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
        consultationFee: true,
      },
    });
  }

  public async delete(recordId: string): Promise<void> {
    await prisma.medicalRecord.update({
      where: { recordId },
      data: { isDeleted: true },
    });
  }
}
