import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";

export class PatientRepository {
  public async findLatestPatient() {
    return await prisma.patient.findFirst({
      where: {
        PatientCode: {
          startsWith: "HS",
        },
      },
      orderBy: { CreatedAt: "desc" },
      select: { PatientCode: true },
    });
  }

  public async existsByCode(code: string): Promise<boolean> {
    let count = await prisma.patient.count({
      where: { PatientCode: code },
    });
    return count > 0;
  }

  public async createPatient(data: CreatePatientRequestDto, patientCode: string) {
    return await prisma.patient.create({
      data: {
        PatientCode: patientCode,
        FullName: data.fullName,
        Gender: data.gender ?? null,
        DOB: new Date(data.dob),
        PatientCategory: data.patientCategory ?? null,
        Phone: data.phone,
        Email: data.email ?? null,
        IdentityCard: data.identityCard ?? null,
        InsuranceNumber: data.insuranceNumber ?? null,
        Occupation: data.occupation ?? null,
        Address: data.address ?? null,
      },
    });
  }

  public async findPatientById(id: string) {
    return await prisma.patient.findUnique({
      where: { PatientID: id },
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
            { FullName: { contains: search, mode: "insensitive" as const } },
            { PatientCode: { contains: search, mode: "insensitive" as const } },
            { Phone: { contains: search, mode: "insensitive" as const } },
            { Email: { contains: search, mode: "insensitive" as const } },
            { IdentityCard: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [patients, totalItems] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { CreatedAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, totalItems };
  }

  public async updatePatient(id: string, data: Prisma.PatientUpdateInput) {
    return await prisma.patient.update({
      where: { PatientID: id },
      data: data,
    });
  }

  public async deletePatient(id: string) {
    return await prisma.patient.delete({
      where: { PatientID: id },
    });
  }

  public async findPatientByCode(patientCode: string) {
    return await prisma.patient.findUnique({
      where: { PatientCode: patientCode },
    });
  }

  public async findPatientByPhone(phone: string) {
    return await prisma.patient.findUnique({
      where: { Phone: phone },
    });
  }

  public async findPatientByIdentityCard(identityCard: string) {
    return await prisma.patient.findUnique({
      where: { IdentityCard: identityCard },
    });
  }

  public async findPatientByInsuranceNumber(insuranceNumber: string) {
    return await prisma.patient.findUnique({
      where: { InsuranceNumber: insuranceNumber },
    });
  }
}
