import { Prisma, Patient, PatientRelative } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { CreatePatientRelativeRequestDto } from "../dtos/create-patient-relative.request.dto";

export class PatientRepository {
  private buildClinicCodeFilter(clinicCode?: string): { PatientCode: { startsWith: string } } | {} {
    if (clinicCode) {
      return {
        PatientCode: {
          startsWith: clinicCode,
        },
      };
    }
    return {};
  }

  public async createPatient(data: CreatePatientRequestDto, patientCode: string): Promise<Patient> {
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

  public async findPatientById(id: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        PatientID: id,
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
            { FullName: { contains: search, mode: "insensitive" as const } },
            { PatientCode: { contains: search, mode: "insensitive" as const } },
            { Phone: { contains: search, mode: "insensitive" as const } },
            { Email: { contains: search, mode: "insensitive" as const } },
            { IdentityCard: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const [patients, totalItems] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: size,
        orderBy: { CreatedAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, totalItems };
  }

  public async updatePatient(id: string, data: Prisma.PatientUpdateInput, clinicCode?: string): Promise<Patient | null> {
    // First check if patient exists with clinic code filter
    const existing = await prisma.patient.findFirst({
      where: {
        PatientID: id,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
    
    if (!existing) {
      return null;
    }
    
    // Update the patient
    return await prisma.patient.update({
      where: { PatientID: id },
      data: data,
    });
  }

  public async findPatientByCode(patientCode: string): Promise<Patient | null> {
    return await prisma.patient.findUnique({
      where: { PatientCode: patientCode },
    });
  }

  public async findPatientByPhone(phone: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        Phone: phone,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByIdentityCard(identityCard: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        IdentityCard: identityCard,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByInsuranceNumber(insuranceNumber: string, clinicCode?: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        InsuranceNumber: insuranceNumber,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  // Patient Relative methods
  public async createRelative(patientId: string, data: CreatePatientRelativeRequestDto): Promise<PatientRelative> {
    return await prisma.patientRelative.create({
      data: {
        PatientID: patientId,
        FullName: data.fullName,
        Phone: data.phone,
        Relationship: data.relationship ?? null,
        IdentityCard: data.identityCard ?? null,
        Address: data.address ?? null,
      },
    });
  }

  public async findRelativeById(relativeId: string, clinicCode: string): Promise<PatientRelative | null> {
    return await prisma.patientRelative.findFirst({
      where: {
        RelativeID: relativeId,
        patient: {
          PatientCode: {
            startsWith: clinicCode,
          },
        },
      },
    });
  }

  public async findRelativesByPatientId(patientId: string): Promise<PatientRelative[]> {
    return await prisma.patientRelative.findMany({
      where: { PatientID: patientId },
    });
  }

  public async updateRelative(relativeId: string, data: Prisma.PatientRelativeUpdateInput): Promise<PatientRelative> {
    return await prisma.patientRelative.update({
      where: { RelativeID: relativeId },
      data: data,
    });
  }
}
