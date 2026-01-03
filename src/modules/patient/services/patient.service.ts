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
      let existingByPhone = await this.patientRepository.findPatientByPhone(data.phone);
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
    }

    if (data.identityCard) {
      let existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard);
      if (existingByIdentityCard) {
        throw new BaseError(400, "CMND/CCCD đã tồn tại");
      }
    }

    if (data.insuranceNumber) {
      let existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber);
      if (existingByInsurance) {
        throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
      }
    }

    let patientCode = await generatePatientCode();
    let result = await this.patientRepository.createPatient(data, patientCode);
    return this.mapToResponseDto(result);
  }

  public async getPatientById(id: string): Promise<PatientResponseDto | null> {
    let patient = await this.patientRepository.findPatientById(id);
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
    let { patients, totalItems } = await this.patientRepository.findPatients(page, size, search);

    let pagination = createPagination(page, size, totalItems);

    return {
      patients: patients.map((patient) => this.mapToResponseDto(patient)),
      pagination,
    };
  }

  public async updatePatient(id: string, data: UpdatePatientRequestDto): Promise<PatientResponseDto> {
    let existingPatient = await this.patientRepository.findPatientById(id);
    if (!existingPatient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const updateData: Prisma.PatientUpdateInput = {};

    if (data.fullName !== undefined) {
      updateData.FullName = data.fullName;
    }

    if (data.gender !== undefined) {
      updateData.Gender = data.gender;
    }

    if (data.dob !== undefined) {
      updateData.DOB = new Date(data.dob);
    }

    if (data.patientCategory !== undefined) {
      updateData.PatientCategory = data.patientCategory;
    }

    if (data.phone !== undefined && data.phone !== existingPatient.Phone) {
      let existingByPhone = await this.patientRepository.findPatientByPhone(data.phone);
      if (existingByPhone) {
        throw new BaseError(400, "Số điện thoại đã tồn tại");
      }
      updateData.Phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.Email = data.email;
    }

    if (data.identityCard !== undefined && data.identityCard !== existingPatient.IdentityCard) {
      if (data.identityCard !== null) {
        let existingByIdentityCard = await this.patientRepository.findPatientByIdentityCard(data.identityCard);
        if (existingByIdentityCard) {
          throw new BaseError(400, "CMND/CCCD đã tồn tại");
        }
      }
      updateData.IdentityCard = data.identityCard;
    }

    if (data.insuranceNumber !== undefined && data.insuranceNumber !== existingPatient.InsuranceNumber) {
      if (data.insuranceNumber !== null) {
        let existingByInsurance = await this.patientRepository.findPatientByInsuranceNumber(data.insuranceNumber);
        if (existingByInsurance) {
          throw new BaseError(400, "Số thẻ BHYT đã tồn tại");
        }
      }
      updateData.InsuranceNumber = data.insuranceNumber;
    }

    if (data.occupation !== undefined) {
      updateData.Occupation = data.occupation;
    }

    if (data.address !== undefined) {
      updateData.Address = data.address;
    }

    let result = await this.patientRepository.updatePatient(id, updateData);
    return this.mapToResponseDto(result);
  }

  public async deletePatient(id: string): Promise<void> {
    let existingPatient = await this.patientRepository.findPatientById(id);
    if (!existingPatient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    await this.patientRepository.deletePatient(id);
  }

  private mapToResponseDto(patient: Patient): PatientResponseDto {
    return {
      patientID: patient.PatientID,
      patientCode: patient.PatientCode ?? "",
      fullName: patient.FullName ?? "",
      gender: patient.Gender,
      dob: formatDate(patient.DOB),
      patientCategory: patient.PatientCategory,
      phone: patient.Phone ?? "",
      email: patient.Email,
      identityCard: patient.IdentityCard,
      insuranceNumber: patient.InsuranceNumber,
      occupation: patient.Occupation,
      address: patient.Address,
      createdAt: formatDateTime(patient.CreatedAt),
      updatedAt: formatDateTime(patient.UpdatedAt),
    };
  }
}
