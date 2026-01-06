import {
  Prisma,
  Patient,
  PatientRelative,
  PatientAllergy,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { CreatePatientRelativeRequestDto } from "../dtos/create-patient-relative.request.dto";
import { CreatePatientAllergyItemDto } from "../dtos/create-patient-allergy.request.dto";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class PatientRepository {
  private buildClinicCodeFilter(
    clinicCode?: string
  ): { patientCode: { startsWith: string } } | {} {
    if (clinicCode) {
      return {
        patientCode: {
          startsWith: clinicCode,
        },
      };
    }
    return {};
  }

  public async createPatient(
    data: CreatePatientRequestDto,
    patientCode: string,
    clinicId: string,
    tx?: TransactionClient
  ): Promise<Patient> {
    const client = tx || prisma;
    return await client.patient.create({
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
        clinicId: clinicId,
      },
    });
  }

  public async findPatientById(
    id: string,
    clinicCode?: string
  ): Promise<Patient | null> {
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
            {
              identityCard: { contains: search, mode: "insensitive" as const },
            },
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

  public async updatePatient(
    id: string,
    data: Prisma.PatientUpdateInput,
    clinicCode?: string
  ): Promise<Patient | null> {
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

  public async findPatientByPhone(
    phone: string,
    clinicCode?: string
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        phone: phone,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByIdentityCard(
    identityCard: string,
    clinicCode?: string
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        identityCard: identityCard,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  public async findPatientByInsuranceNumber(
    insuranceNumber: string,
    clinicCode?: string
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        insuranceNumber: insuranceNumber,
        ...this.buildClinicCodeFilter(clinicCode),
      },
    });
  }

  // Patient Relative methods
  public async createRelatives(
    patientId: string,
    relatives: CreatePatientRelativeRequestDto[],
    tx?: TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || prisma;
    return await client.patientRelative.createMany({
      data: relatives.map((relative) => ({
        patientId: patientId,
        fullName: relative.fullName,
        phone: relative.phone,
        relationship: relative.relationship ?? null,
        identityCard: relative.identityCard ?? null,
        address: relative.address ?? null,
      })),
    });
  }

  public async findRelativeById(
    relativeId: string,
    clinicCode: string
  ): Promise<PatientRelative | null> {
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

  public async findRelativesByPatientId(
    patientId: string
  ): Promise<PatientRelative[]> {
    return await prisma.patientRelative.findMany({
      where: { patientId: patientId },
    });
  }

  public async findRelativeByIdentityCard(
    identityCard: string
  ): Promise<PatientRelative | null> {
    return await prisma.patientRelative.findFirst({
      where: { identityCard: identityCard },
    });
  }

  public async updateRelative(
    relativeId: string,
    data: Prisma.PatientRelativeUpdateInput
  ): Promise<PatientRelative> {
    return await prisma.patientRelative.update({
      where: { relativeId: relativeId },
      data: data,
    });
  }

  public async upsertAllergies(
    patientId: string,
    allergies: CreatePatientAllergyItemDto[],
    tx?: Prisma.TransactionClient
  ): Promise<PatientAllergy> {
    const client = tx || prisma;
    const allergyJsonData = allergies.map((allergy) => ({
      drug: allergy.drug,
      reaction: allergy.reaction ?? null,
    }));

    return await client.patientAllergy.upsert({
      where: { patientId },
      update: { data: allergyJsonData as any },
      create: { patientId, data: allergyJsonData as any },
    });
  }

  public async findAllergyById(
    allergyId: string,
    clinicCode: string,
    tx?: Prisma.TransactionClient
  ): Promise<PatientAllergy | null> {
    const client = tx || prisma;
    return await client.patientAllergy.findFirst({
      where: {
        allergyId,
        patient: {
          patientCode: {
            startsWith: clinicCode,
          },
        },
      },
    });
  }

  public async findAllergiesByPatientId(
    patientId: string,
    tx?: Prisma.TransactionClient
  ): Promise<PatientAllergy[]> {
    const client = tx || prisma;
    return await client.patientAllergy.findMany({
      where: { patientId },
    });
  }

  public async updateAllergy(
    allergyId: string,
    data: Prisma.PatientAllergyUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<PatientAllergy> {
    const client = tx || prisma;
    return await client.patientAllergy.update({
      where: { allergyId },
      data,
    });
  }

  public async deleteAllergy(allergyId: string): Promise<PatientAllergy> {
    return await prisma.patientAllergy.delete({
      where: { allergyId },
    });
  }

  public async getDailyQueue(clinicId: string, start: Date, end: Date) {
    return await prisma.patient.findMany({
      where: {
        clinicId: clinicId,
        OR: [
          {
            createdAt: { gte: start, lte: end },
          },
          {
            medicalRecords: {
              some: {
                clinicId: clinicId,
                createdAt: { gte: start, lte: end },
              },
            },
          },
        ],
      },
      select: {
        patientId: true,
        patientCode: true,
        fullName: true,
        gender: true,
        identityCard: true,
        dob: true,
        phone: true,
        createdAt: true,

        medicalRecords: {
          where: {
            clinicId: clinicId,
            createdAt: { gte: start, lte: end }
          },
          select: {
            recordId: true,
            createdAt: true,
            diagnoses: true,
            prescription: { select: { prescriptionId: true }},
            clinicalExamination: { select: { examId: true }}
          },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}

