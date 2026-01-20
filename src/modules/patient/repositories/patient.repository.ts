import {
  Prisma,
  Patient,
  PatientRelative,
  PatientAllergy,
  PrismaClient,
  Gender,
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
  private buildClinicIdFilter(clinicId?: string): { clinicId: string } | {} {
    if (clinicId) {
      return {
        clinicId: clinicId,
      };
    }
    return {};
  }

  public async createPatient(
    data: CreatePatientRequestDto,
    patientCode: string,
    clinicId?: string,
    tx?: TransactionClient,
  ): Promise<Patient> {
    const client = tx || prisma;
    return await client.patient.create({
      data: {
        patientCode: patientCode,
        fullName: data.fullName ?? null,
        gender: data.gender ?? null,
        dob: data.dob ? new Date(data.dob) : null,
        patientCategory: data.patientCategory ?? null,
        phone: data.phone ?? null,
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
    clinicId?: string,
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        patientId: id,
        ...this.buildClinicIdFilter(clinicId),
      },
    });
  }

  public async findPatients(
    page: number = 1,
    size: number = 10,
    search?: string,
    clinicId?: string,
    sortBy:
      | "gender"
      | "identityCard"
      | "phone"
      | "email"
      | "createdAt" = "createdAt",
    sortDirection: "asc" | "desc" = "desc",
    gender?: Gender,
  ): Promise<{ patients: Patient[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const baseWhere = {
      ...this.buildClinicIdFilter(clinicId),
      ...(gender ? { gender } : {}),
    };

    const normalizedSearch = search?.trim().toLowerCase();
    const genderFilter =
      normalizedSearch === "male"
        ? Gender.Male
        : normalizedSearch === "female"
          ? Gender.Female
          : normalizedSearch === "other"
            ? Gender.Other
            : normalizedSearch === "nam"
              ? Gender.Male
              : normalizedSearch === "nu"
                ? Gender.Female
                : undefined;

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

    const primaryOrderBy: Prisma.PatientOrderByWithRelationInput =
      sortBy === "createdAt"
        ? { createdAt: sortDirection }
        : ({
            [sortBy]: sortDirection,
          } as Prisma.PatientOrderByWithRelationInput);
    const orderBy:
      | Prisma.PatientOrderByWithRelationInput
      | Prisma.PatientOrderByWithRelationInput[] =
      sortBy === "createdAt"
        ? primaryOrderBy
        : [primaryOrderBy, { createdAt: "desc" as Prisma.SortOrder }];

    const [patients, totalItems] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, totalItems };
  }

  public async updatePatient(
    id: string,
    data: Prisma.PatientUpdateInput,
    clinicId?: string,
  ): Promise<Patient | null> {
    // First check if patient exists with clinic id filter
    const existing = await prisma.patient.findFirst({
      where: {
        patientId: id,
        ...this.buildClinicIdFilter(clinicId),
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
    clinicId?: string,
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        phone: phone,
        ...this.buildClinicIdFilter(clinicId),
      },
    });
  }

  public async findPatientByIdentityCard(
    identityCard: string,
    clinicId?: string,
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        identityCard: identityCard,
        ...this.buildClinicIdFilter(clinicId),
      },
    });
  }

  public async findPatientByInsuranceNumber(
    insuranceNumber: string,
    clinicId?: string,
  ): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        insuranceNumber: insuranceNumber,
        ...this.buildClinicIdFilter(clinicId),
      },
    });
  }

  // Patient Relative methods
  public async createRelatives(
    patientId: string,
    relatives: CreatePatientRelativeRequestDto[],
    tx?: TransactionClient,
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
    clinicId?: string,
  ): Promise<PatientRelative | null> {
    return await prisma.patientRelative.findFirst({
      where: {
        relativeId: relativeId,
        ...(clinicId
          ? {
              patient: {
                clinicId: clinicId,
              },
            }
          : {}),
      },
    });
  }

  public async findRelativesByPatientId(
    patientId: string,
  ): Promise<PatientRelative[]> {
    return await prisma.patientRelative.findMany({
      where: { patientId: patientId },
    });
  }

  public async updateRelative(
    relativeId: string,
    data: Prisma.PatientRelativeUpdateInput,
  ): Promise<PatientRelative> {
    return await prisma.patientRelative.update({
      where: { relativeId: relativeId },
      data: data,
    });
  }

  public async upsertAllergies(
    patientId: string,
    allergies: CreatePatientAllergyItemDto[],
    tx?: Prisma.TransactionClient,
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
    clinicId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PatientAllergy | null> {
    const client = tx || prisma;
    return await client.patientAllergy.findFirst({
      where: {
        allergyId,
        ...(clinicId
          ? {
              patient: {
                clinicId: clinicId,
              },
            }
          : {}),
      },
    });
  }

  public async findAllergiesByPatientId(
    patientId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PatientAllergy[]> {
    const client = tx || prisma;
    return await client.patientAllergy.findMany({
      where: { patientId },
    });
  }

  public async updateAllergy(
    allergyId: string,
    data: Prisma.PatientAllergyUpdateInput,
    tx?: Prisma.TransactionClient,
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

  public async getDailyQueue(
    clinicId: string | undefined,
    start: Date,
    end: Date,
    search?: string,
    status?: string,
  ) {
    const normalizedSearch = search?.trim().toLocaleLowerCase();
    let medicalRecordFilter: any = {
      ...(clinicId ? { clinicId: clinicId } : {}),
      createdAt: { gte: start, lte: end },
    };
    return await prisma.patient.findMany({
      where: {
        ...(clinicId ? { clinicId: clinicId } : {}),
        OR: [
          {
            createdAt: { gte: start, lte: end },
          },
          {
            medicalRecords: {
              some: {
                ...(clinicId ? { clinicId: clinicId } : {}),
                createdAt: { gte: start, lte: end },
              },
            },
          },
          ...(normalizedSearch
            ? [
                {
                  fullName: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
                {
                  patientCode: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
                {
                  phone: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
                {
                  identityCard: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
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
            ...(clinicId ? { clinicId: clinicId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            recordId: true,
            createdAt: true,
            diagnoses: true,
            prescription: { select: { prescriptionId: true } },
            clinicalExamination: { select: { examId: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
