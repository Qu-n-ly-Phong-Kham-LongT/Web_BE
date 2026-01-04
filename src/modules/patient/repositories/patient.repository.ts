import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";

export class PatientRepository {
  public async findLatestPatient() {
    return await prisma.patient.findFirst({
      where: {
        patientCode: {
          startsWith: "HS",
        },
      },
      orderBy: { createdAt: "desc" },
      select: { patientCode: true },
    });
  }

  public async existsByCode(code: string): Promise<boolean> {
    let count = await prisma.patient.count({
      where: { patientCode: code },
    });
    return count > 0;
  }

  public async createPatient(data: CreatePatientRequestDto, patientCode: string) {
    return await prisma.patient.create({
      data: {
        patientCode: patientCode,
        fullName: data.fullName,
        gender: data.gender ?? null,
        dob: new Date(data.dob),
        patientCategory: data.patientCategory ?? null,
        phone: data.phone,
        email: data.email ?? null,
        identityCard: data.identityCard ?? null,
        insuranceNumber: data.insuranceNumber ?? null,
        occupation: data.occupation ?? null,
        address: data.address ?? null,
      },
    });
  }

  public async findPatientById(id: string) {
    return await prisma.patient.findUnique({
      where: { patientId: id },
    });
  }

  public async findPatients(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ) {
    const skip = (page - 1) * pageSize;
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { patientCode: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { identityCard: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [patients, totalItems] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, totalItems };
  }

  public async updatePatient(id: string, data: Prisma.PatientUpdateInput) {
    return await prisma.patient.update({
      where: { patientId: id },
      data: data,
    });
  }

  public async deletePatient(id: string) {
    return await prisma.patient.delete({
      where: { patientId: id },
    });
  }

  public async findPatientByCode(patientCode: string) {
    return await prisma.patient.findUnique({
      where: { patientCode: patientCode },
    });
  }

  public async findPatientByPhone(phone: string) {
    return await prisma.patient.findUnique({
      where: { phone: phone },
    });
  }

  public async findPatientByIdentityCard(identityCard: string) {
    return await prisma.patient.findUnique({
      where: { identityCard: identityCard },
    });
  }

  public async findPatientByInsuranceNumber(insuranceNumber: string) {
    return await prisma.patient.findUnique({
      where: { insuranceNumber: insuranceNumber },
    });
  }
}
