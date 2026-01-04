import { Patient, Prisma } from "@prisma/client";

import { BaseError } from "../../../utils/base-error.util";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientRepository } from "../repositories/patient.repository";
import { createPagination } from "../../../utils/pagination.util";
import { generatePatientCode } from "../../../utils/patient-code.util";
import { formatDate, formatDateTime } from "../../../utils/date.util";

export class PatientService {
  private patientRepository = new PatientRepository();

  public async createPatient(data: CreatePatientRequestDto): Promise<PatientResponseDto> {
    if (data.phone) {
      const existingByPhone = await this.patientRepository.findPatientByPhone(data.phone);
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
    }

    if (data.identityCard) {
      const existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard);
      if (existingByIdentityCard) {
        throw new BaseError(400, "CMND/CCCD đã tồn tại");
      }
    }

    if (data.insuranceNumber) {
      const existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber);
      if (existingByInsurance) {
        throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
      }
    }

    const patientCode = await generatePatientCode();
    const result = await this.patientRepository.createPatient(data, patientCode);
    return this.mapToResponseDto(result);
  }

  public async getPatientById(id: string): Promise<PatientResponseDto | null> {
    const patient = await this.patientRepository.findPatientById(id);
    if (!patient) {
      return null;
    }
    return this.mapToResponseDto(patient);
  }

  public async getPatients(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<PatientListResponseDto> {
    const { patients, totalItems } = await this.patientRepository.findPatients(page, size, search);

    const pagination = createPagination(page, size, totalItems);

    return {
      patients: patients.map((patient) => this.mapToResponseDto(patient)),
      pagination,
    };
  }

  public async updatePatient(id: string, data: UpdatePatientRequestDto): Promise<PatientResponseDto> {
    const existingPatient = await this.patientRepository.findPatientById(id);
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
      const existingByPhone = await this.patientRepository.findPatientByPhone(data.phone);
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
        const existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard);
        if (existingByIdentityCard) {
          throw new BaseError(400, "CMND/CCCD đã tồn tại");
        }
      }
      updateData.identityCard = data.identityCard;
    }

    if (data.insuranceNumber !== undefined && data.insuranceNumber !== existingPatient.insuranceNumber) {
      if (data.insuranceNumber !== null) {
        const existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber);
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

    const result = await this.patientRepository.updatePatient(id, updateData);
    return this.mapToResponseDto(result);
  }

  public async deletePatient(id: string): Promise<void> {
    const existingPatient = await this.patientRepository.findPatientById(id);
    if (!existingPatient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    await this.patientRepository.deletePatient(id);
  }

  private mapToResponseDto(patient: Patient): PatientResponseDto {
    return {
      patientID: patient.patientId,
      patientCode: patient.patientCode ?? "",
      fullName: patient.fullName ?? "",
      gender: patient.gender,
      dob: formatDate(patient.dob),
      patientCategory: patient.patientCategory,
      phone: patient.phone ?? "",
      email: patient.email,
      identityCard: patient.identityCard,
      insuranceNumber: patient.insuranceNumber,
      occupation: patient.occupation,
      address: patient.address,
      createdAt: formatDateTime(patient.createdAt),
      updatedAt: formatDateTime(patient.updatedAt),
    };
  }
}
