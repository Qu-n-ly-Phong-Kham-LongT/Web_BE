import { Patient, Prisma, Gender, PatientCategory, PatientRelative } from "@prisma/client";

import { BaseError } from "../../../utils/base-error.util";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientEnumResponseDto } from "../dtos/patient-enum.response.dto";
import { PatientRelativeResponseDto } from "../dtos/patient-relative.response.dto";
import { CreatePatientRelativeRequestDto } from "../dtos/create-patient-relative.request.dto";
import { UpdatePatientRelativeRequestDto } from "../dtos/update-patient-relative.request.dto";
import { PatientRepository } from "../repositories/patient.repository";
import { createPagination } from "../../../utils/pagination.util";
import { generatePatientCode } from "../../../utils/patient-code.util";
import { prisma } from "../../../config/database.config";

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

  public async createPatient(data: CreatePatientRequestDto, clinicId: string): Promise<PatientResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    
    if (data.phone) {
      let existingByPhone = await this.patientRepository.findPatientByPhone(data.phone, clinicCode);
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
    }

    if (data.identityCard) {
      let existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard, clinicCode);
      if (existingByIdentityCard) {
        throw new BaseError(400, "CMND/CCCD đã tồn tại");
      }
    }

    if (data.insuranceNumber) {
      let existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber, clinicCode);
      if (existingByInsurance) {
        throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
      }
    }

    let patientCode = await generatePatientCode(clinicId);
    let result = await this.patientRepository.createPatient(data, patientCode);
    return this.mapToResponseDto(result);
  }

  public async getPatientById(id: string, clinicId: string): Promise<PatientResponseDto> {
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
    let { patients, totalItems } = await this.patientRepository.findPatients(page, size, search, clinicCode);

    let pagination = createPagination(page, size, totalItems);

    return {
      patients: patients.map((patient) => this.mapToResponseDto(patient)),
      pagination,
    };
  }

  public async updatePatient(id: string, data: UpdatePatientRequestDto, clinicId: string): Promise<PatientResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    let existingPatient = await this.patientRepository.findPatientById(id, clinicCode);
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
      let existingByPhone = await this.patientRepository.findPatientByPhone(data.phone, clinicCode);
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
      updateData.phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.identityCard !== undefined && data.identityCard !== existingPatient.identityCard) {
      if (data.identityCard !== null) {
        let existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard, clinicCode);
        if (existingByIdentityCard) {
          throw new BaseError(400, "CMND/CCCD đã tồn tại");
        }
      }
      updateData.identityCard = data.identityCard;
    }

    if (data.insuranceNumber !== undefined && data.insuranceNumber !== existingPatient.insuranceNumber) {
      if (data.insuranceNumber !== null) {
        let existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber, clinicCode);
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

    let result = await this.patientRepository.updatePatient(id, updateData, clinicCode);
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

  // Patient Relative methods
  public async createRelative(
    patientId: string,
    data: CreatePatientRelativeRequestDto,
    clinicId: string
  ): Promise<PatientRelativeResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const patient = await this.patientRepository.findPatientById(patientId, clinicCode);
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const result = await this.patientRepository.createRelative(patientId, data);
    return this.mapRelativeToResponseDto(result);
  }

  public async getRelativeById(relativeId: string, clinicId: string): Promise<PatientRelativeResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const relative = await this.patientRepository.findRelativeById(relativeId, clinicCode);
    if (!relative) {
      throw new BaseError(404, "Không tìm thấy thông tin người thân");
    }
    
    return this.mapRelativeToResponseDto(relative);
  }

  public async getRelativesByPatientId(patientId: string, clinicId: string): Promise<PatientRelativeResponseDto[]> {
    const clinicCode = await this.getClinicCode(clinicId);
    const patient = await this.patientRepository.findPatientById(patientId, clinicCode);
    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const relatives = await this.patientRepository.findRelativesByPatientId(patientId);
    return relatives.map((relative) => this.mapRelativeToResponseDto(relative));
  }

  public async updateRelative(
    relativeId: string,
    data: UpdatePatientRelativeRequestDto,
    clinicId: string
  ): Promise<PatientRelativeResponseDto> {
    const clinicCode = await this.getClinicCode(clinicId);
    const existingRelative = await this.patientRepository.findRelativeById(relativeId, clinicCode);
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

    const result = await this.patientRepository.updateRelative(relativeId, updateData);
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

  private mapRelativeToResponseDto(relative: PatientRelative): PatientRelativeResponseDto {
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
}
