import {
  Patient,
  Prisma,
  Gender,
  PatientCategory,
  PatientRelative,
  PatientAllergy,
} from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientEnumResponseDto } from "../dtos/patient-enum.response.dto";
import { PatientRelativeResponseDto } from "../dtos/patient-relative.response.dto";
import { UpdatePatientRelativeRequestDto } from "../dtos/update-patient-relative.request.dto";
import { PatientAllergyResponseDto } from "../dtos/patient-allergy.response.dto";
import {
  CreatePatientAllergyItemDto,
  CreatePatientAllergyRequestDto,
} from "../dtos/create-patient-allergy.request.dto";
import { UpdatePatientAllergyRequestDto } from "../dtos/update-patient-allergy.request.dto";
import { PatientRepository } from "../repositories/patient.repository";
import { createPagination } from "../../../utils/pagination.util";
import { generatePatientCode } from "../../../utils/patient-code.util";
import { prisma } from "../../../config/database.config";
import { PatientQueueItemDto, QueueStatus } from "../dtos/patient.response.dto";

export class PatientService {
  private patientRepository = new PatientRepository();

  private async getClinicCode(clinicId: string): Promise<string> {
    const clinic = await prisma.clinic.findUnique({
      where: { clinicId: clinicId },
      select: { clinicCode: true },
    });

    if (!clinic || !clinic.clinicCode) {
      throw new BaseError(404, "Clinic code not found");
    }

    return clinic.clinicCode;
  }

  public async createPatient(
    data: CreatePatientRequestDto,
    clinicId: string
  ): Promise<PatientResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);

    if (data.phone) {
      let existingByPhone = await this.patientRepository.findPatientByPhone(
        data.phone,
        clinicCode
      );
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
    }

    if (data.identityCard) {
      let existingByIdentityCard =
        await this.patientRepository.findPatientByIdentityCard(
          data.identityCard,
          clinicCode
        );
      if (existingByIdentityCard) {
        throw new BaseError(400, "CMND/CCCD đã tồn tại");
      }
    }

    if (data.insuranceNumber) {
      let existingByInsurance =
        await this.patientRepository.findPatientByInsuranceNumber(
          data.insuranceNumber,
          clinicCode
        );
      if (existingByInsurance) {
        throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
      }
    }

    if (data.relatives?.length) {
      const identityCards = data.relatives
        .map((r) => r.identityCard)
        .filter((card): card is string => !!card);
      if (new Set(identityCards).size !== identityCards.length) {
        throw new BaseError(
          400,
          "CMND/CCCD không được trùng lặp trong danh sách người thân"
        );
      }

      for (const relative of data.relatives) {
        if (relative.identityCard) {
          let existingRelative =
            await this.patientRepository.findRelativeByIdentityCard(
              relative.identityCard
            );
          if (existingRelative) {
            throw new BaseError(400, "CMND/CCCD của người thân đã tồn tại");
          }
        }
      }
    }

    let patientCode = await generatePatientCode(clinicId);

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const patient = await this.patientRepository.createPatient(
          data,
          patientCode,
          clinicId,
          tx
        );
        if (data.relatives?.length) {
          await this.patientRepository.createRelatives(
            patient.patientId,
            data.relatives,
            tx
          );
        }
        return patient;
      }
    );

    return this.mapToResponseDto(result);
  }

  public async getPatientById(
    id: string,
    clinicId: string
  ): Promise<PatientResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    let patient = await this.patientRepository.findPatientById(id, clinicCode);
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }
    return this.mapToResponseDto(patient);
  }

  public async getPatients(
    page: number = 1,
    size: number = 10,
    search: string | undefined,
    clinicId: string
  ): Promise<PatientListResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    let { patients, totalItems } = await this.patientRepository.findPatients(
      page,
      size,
      search,
      clinicCode
    );

    let pagination = createPagination(page, size, totalItems);

    return {
      patients: patients.map((patient) => this.mapToResponseDto(patient)),
      pagination,
    };
  }

  public async updatePatient(
    id: string,
    data: UpdatePatientRequestDto,
    clinicId: string
  ): Promise<PatientResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    let existingPatient = await this.patientRepository.findPatientById(
      id,
      clinicCode
    );
    if (!existingPatient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const updateData: Prisma.PatientUpdateInput = {};

    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }

    if (data.dob !== undefined) {
      updateData.dob = new Date(data.dob);
    }

    if (data.patientCategory !== undefined) {
      updateData.patientCategory = data.patientCategory;
    }

    if (data.phone !== undefined && data.phone !== existingPatient.phone) {
      let existingByPhone = await this.patientRepository.findPatientByPhone(
        data.phone,
        clinicCode
      );
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
      updateData.phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (
      data.identityCard !== undefined &&
      data.identityCard !== existingPatient.identityCard
    ) {
      if (data.identityCard !== null) {
        let existingByIdentityCard =
          await this.patientRepository.findPatientByIdentityCard(
            data.identityCard,
            clinicCode
          );
        if (existingByIdentityCard) {
          throw new BaseError(400, "CMND/CCCD đã tồn tại");
        }
      }
      updateData.identityCard = data.identityCard;
    }

    if (
      data.insuranceNumber !== undefined &&
      data.insuranceNumber !== existingPatient.insuranceNumber
    ) {
      if (data.insuranceNumber !== null) {
        let existingByInsurance =
          await this.patientRepository.findPatientByInsuranceNumber(
            data.insuranceNumber,
            clinicCode
          );
        if (existingByInsurance) {
          throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
        }
      }
      updateData.insuranceNumber = data.insuranceNumber;
    }

    if (data.occupation !== undefined) {
      updateData.occupation = data.occupation;
    }

    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    let result = await this.patientRepository.updatePatient(
      id,
      updateData,
      clinicCode
    );
    if (!result) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }
    return this.mapToResponseDto(result);
  }

  public async getPatientEnums(): Promise<PatientEnumResponseDto> {
    return {
      gender: Object.values(Gender),
      patientCategory: Object.values(PatientCategory),
    };
  }

  public async getRelativeById(
    relativeId: string,
    clinicId: string
  ): Promise<PatientRelativeResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const relative = await this.patientRepository.findRelativeById(
      relativeId,
      clinicCode
    );
    if (!relative) {
      throw new BaseError(404, "Không tìm thấy thông tin người thân");
    }

    return this.mapRelativeToResponseDto(relative);
  }

  public async getRelativesByPatientId(
    patientId: string,
    clinicId: string
  ): Promise<PatientRelativeResponseDto[]> {
    const clinicCode = await this.getClinicCode(clinicId);
    const patient = await this.patientRepository.findPatientById(
      patientId,
      clinicCode
    );
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const relatives =
      await this.patientRepository.findRelativesByPatientId(patientId);
    return relatives.map((relative) => this.mapRelativeToResponseDto(relative));
  }

  public async updateRelative(
    relativeId: string,
    data: UpdatePatientRelativeRequestDto,
    clinicId: string
  ): Promise<PatientRelativeResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const existingRelative = await this.patientRepository.findRelativeById(
      relativeId,
      clinicCode
    );
    if (!existingRelative) {
      throw new BaseError(404, "Không tìm thấy thông tin người thân");
    }

    const updateData: Prisma.PatientRelativeUpdateInput = {};

    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.relationship !== undefined) {
      updateData.relationship = data.relationship;
    }

    if (data.identityCard !== undefined) {
      updateData.identityCard = data.identityCard;
    }

    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    const result = await this.patientRepository.updateRelative(
      relativeId,
      updateData
    );
    return this.mapRelativeToResponseDto(result);
  }

  private mapToResponseDto(patient: Patient): PatientResponseDto {
    return {
      patientID: patient.patientId,
      patientCode: patient.patientCode ?? "",
      fullName: patient.fullName ?? "",
      gender: patient.gender,
      dob: patient.dob ? patient.dob.toISOString() : "",
      patientCategory: patient.patientCategory,
      phone: patient.phone ?? "",
      email: patient.email,
      identityCard: patient.identityCard,
      insuranceNumber: patient.insuranceNumber,
      occupation: patient.occupation,
      address: patient.address,
      createdAt: patient.createdAt ? patient.createdAt.toISOString() : "",
      updatedAt: patient.updatedAt ? patient.updatedAt.toISOString() : "",
    };
  }

  private mapRelativeToResponseDto(
    relative: PatientRelative
  ): PatientRelativeResponseDto {
    return {
      relativeID: relative.relativeId,
      patientID: relative.patientId ?? "",
      fullName: relative.fullName ?? "",
      phone: relative.phone ?? "",
      relationship: relative.relationship,
      identityCard: relative.identityCard,
      address: relative.address,
    };
  }

  // Patient Allergy methods
  public async createAllergies(
    patientId: string,
    data: CreatePatientAllergyRequestDto,
    clinicId: string
  ): Promise<PatientAllergyResponseDto[]> {
    const clinicCode = await this.getClinicCode(clinicId);
    const patient = await this.patientRepository.findPatientById(
      patientId,
      clinicCode
    );
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    await this.patientRepository.upsertAllergies(patientId, data.allergies);
    const allergies =
      await this.patientRepository.findAllergiesByPatientId(patientId);
    return this.mapAllergyRecordsToDtos(allergies);
  }

  public async getAllergyById(
    allergyId: string,
    clinicId: string
  ): Promise<PatientAllergyResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const allergy = await this.patientRepository.findAllergyById(
      allergyId,
      clinicCode
    );
    if (!allergy) {
      throw new BaseError(404, "Không tìm thấy thông tin dị ứng");
    }

    const dtos = this.mapAllergyRecordsToDtos([allergy]);
    return dtos[0];
  }

  public async getAllergiesByPatientId(
    patientId: string,
    clinicId: string
  ): Promise<PatientAllergyResponseDto[]> {
    const clinicCode = await this.getClinicCode(clinicId);
    const patient = await this.patientRepository.findPatientById(
      patientId,
      clinicCode
    );
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const allergies =
      await this.patientRepository.findAllergiesByPatientId(patientId);
    return this.mapAllergyRecordsToDtos(allergies);
  }

  public async updateAllergy(
    allergyId: string,
    data: UpdatePatientAllergyRequestDto,
    clinicId: string
  ): Promise<PatientAllergyResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const existingAllergy = await this.patientRepository.findAllergyById(
      allergyId,
      clinicCode
    );
    if (!existingAllergy) {
      throw new BaseError(404, "Không tìm thấy thông tin dị ứng");
    }

    const payload: CreatePatientAllergyItemDto[] = [
      {
        drug: data.drug ?? (existingAllergy.data as any)?.drug ?? "",
        reaction:
          data.reaction ?? (existingAllergy.data as any)?.reaction ?? null,
      },
    ];

    const updated = await this.patientRepository.upsertAllergies(
      existingAllergy.patientId,
      payload
    );
    return this.mapAllergyRecordsToDtos([updated])[0];
  }

  public async deleteAllergy(
    allergyId: string,
    clinicId: string
  ): Promise<void> {
    const clinicCode = await this.getClinicCode(clinicId);
    const existingAllergy = await this.patientRepository.findAllergyById(
      allergyId,
      clinicCode
    );
    if (!existingAllergy) {
      throw new BaseError(404, "Không tìm thấy thông tin dị ứng");
    }

    await this.patientRepository.deleteAllergy(allergyId);
  }

  private mapAllergyRecordsToDtos(
    records: PatientAllergy[]
  ): PatientAllergyResponseDto[] {
    const result: PatientAllergyResponseDto[] = [];
    for (const record of records || []) {
      const data = (record.data as any) || [];
      if (Array.isArray(data)) {
        data.forEach((item: any) =>
          result.push({
            allergyID: record.allergyId,
            patientID: record.patientId,
            drug: item?.drug ?? null,
            reaction: item?.reaction ?? null,
          })
        );
      } else {
        result.push({
          allergyID: record.allergyId,
          patientID: record.patientId,
          drug: (data as any)?.drug ?? null,
          reaction: (data as any)?.reaction ?? null,
        });
      }
    }
    return result;
  }

  public async getDailyQueue(
    clinicId: string,
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<{
    queue: PatientQueueItemDto[];
    pagination: ReturnType<typeof createPagination>;
  }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const patients = await this.patientRepository.getDailyQueue(
      clinicId,
      start,
      end
    );

    const mappedList = patients.map((p) => {
      let age = 0;
      if (p.dob) {
        const diff = Date.now() - new Date(p.dob).getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }

      const record = p.medicalRecords[0] || null;
      let status = QueueStatus.WAITING;
      let recordId = null;

      let arrivedAt = p.createdAt ? new Date(p.createdAt) : new Date();

      if (record) {
        recordId = record.recordId;
        if (record.createdAt) {
          arrivedAt = new Date(record.createdAt);
        }

        if (record.diagnoses || record.prescription) {
          status = QueueStatus.COMPLETED;
        } else if (record.clinicalExamination) {
          status = QueueStatus.IN_PROGRESS;
        }
      }

      return {
        patientId: p.patientId,
        patientCode: p.patientCode ?? "",
        todayRecordId: recordId ?? null,
        fullName: p.fullName ?? null,
        identityCard: p.identityCard ?? null,
        gender: p.gender ?? "Other",
        age: age,
        phone: p.phone ?? "",
        status: status,
        arrivedAt: arrivedAt,
      };
    });
    mappedList.sort((a, b) => b.arrivedAt.getTime() - a.arrivedAt.getTime());

    const normalizedSearch = search?.trim().toLowerCase();
    const filteredList = normalizedSearch
      ? mappedList.filter((item) => {
          return (
            item.fullName?.toLowerCase().includes(normalizedSearch) ||
            item.patientCode.toLowerCase().includes(normalizedSearch) ||
            item.phone.toLowerCase().includes(normalizedSearch) ||
            (item.identityCard ?? "").toLowerCase().includes(normalizedSearch)
          );
        })
      : mappedList;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeSize = Math.max(Number(size) || 10, 1);
    const totalItems = filteredList.length;

    const startIndex = (safePage - 1) * safeSize;
    const endIndex = startIndex + safeSize;

    const paginatedData = filteredList.slice(startIndex, endIndex);
    const meta = createPagination(safePage, safeSize, totalItems);

    return { queue: paginatedData, pagination: meta };
  }
}
