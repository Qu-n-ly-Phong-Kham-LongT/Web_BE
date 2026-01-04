import { Prisma, Patient, PatientRelative } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { CreatePatientRelativeRequestDto } from "../dtos/create-patient-relative.request.dto";

export class PatientRepository {
  private buildClinicCodeFilter(clinicCode?: string): { patientCode: { startsWith: string } } | {} {
    if (clinicCode) {
      return {
        patientCode: {
          startsWith: clinicCode,
        },
      };
    }
    return {};
  }

  public async createPatient(data: CreatePatientRequestDto, patientCode: string): Promise<Patient> {
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

  public async findPatientById(id: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        patientId: id,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatients(
    page: number = 1,
    size: number = 10,
    search?: string,
    clinicCode?: string
  ): Promise<{ patients: Patient[]; totalItems: number }> {
    const skip = (page - 1) * size;
    
    const baseWhere = {
      ...this.buildClinicCodeFilter(clinicCode),
    };

    const where = search
      ? {
          ...baseWhere,
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { patientCode: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { identityCard: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const [patients, totalItems] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, totalItems };
  }

  public async updatePatient(id: string, data: Prisma.PatientUpdateInput, clinicCode?: string): Promise<Patient | null> {
    // First check if patient exists with clinic code filter
    const existing = await prisma.patient.findFirst({
      where: {
        patientId: id,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
    
    if (!existing) {
      return null;
    }
    
    // Update the patient
    return await prisma.patient.update({
      where: { patientId: id },
      data: data,
    });
  }

  public async findPatientByCode(patientCode: string): Promise<Patient | null> {
    return await prisma.patient.findUnique({
      where: { patientCode: patientCode },
    });
  }

  public async findPatientByPhone(phone: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        phone: phone,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByIdentityCard(identityCard: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        identityCard: identityCard,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByInsuranceNumber(insuranceNumber: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        insuranceNumber: insuranceNumber,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  // Patient Relative methods
  public async createRelative(patientId: string, data: CreatePatientRelativeRequestDto): Promise<PatientRelative> {
    return await prisma.patientRelative.create({
      data: {
        patientId: patientId,
        fullName: data.fullName,
        phone: data.phone,
        relationship: data.relationship ?? null,
        identityCard: data.identityCard ?? null,
        address: data.address ?? null,
      },
    });
  }

  public async findRelativeById(relativeId: string, clinicCode: string): Promise<PatientRelative | null> {
    return await prisma.patientRelative.findFirst({
      where: {
        relativeId: relativeId,
        patient: {
          patientCode: {
            startsWith: clinicCode,
          },
        },
      },
    });
  }

  public async findRelativesByPatientId(patientId: string): Promise<PatientRelative[]> {
    return await prisma.patientRelative.findMany({
      where: { patientId: patientId },
    });
  }

  public async updateRelative(relativeId: string, data: Prisma.PatientRelativeUpdateInput): Promise<PatientRelative> {
    return await prisma.patientRelative.update({
      where: { relativeId: relativeId },
      data: data,
    });
  }
}
