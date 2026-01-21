import { Session } from "@prisma/client";
import { ClinicRepository } from "../repositories/clinic.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicRequestDto } from "../dtos/clinic.request.dto";
import { ClinicListResponseDto, ClinicResponseDto } from "../dtos/clinic.response.dto";
import { createPagination } from "../../../utils/pagination.util";
import { Decimal } from "@prisma/client/runtime/client";

export class ClinicService {
  private clinicRepository = new ClinicRepository();

  public async getClinicById(id: string): Promise<ClinicResponseDto> {
    const clinic = await this.clinicRepository.findClinicById(id);
    if (!clinic) {
      throw new BaseError(404, "Phòng khám không tồn tại.");
    }
    return this.mapToResponse(clinic);
  }

  public async createClinic(
    createData: ClinicRequestDto
  ): Promise<ClinicResponseDto> {
    const clinic = await this.clinicRepository.createClinic(createData);
    return this.mapToResponse(clinic);
  }

  public async updateClinic(
    id: string,
    updateData: ClinicRequestDto
  ): Promise<ClinicResponseDto> {
    const clinicToUpdate = await this.clinicRepository.findClinicById(id);
    if (!clinicToUpdate) {
      throw new BaseError(404, "Phòng khám không tồn tại");
    }
    const clinic = await this.clinicRepository.updateClinic(id, updateData);
    return this.mapToResponse(clinic);
  }

  public async getClinics(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<ClinicListResponseDto> {
    const { clinics, totalItems } = await this.clinicRepository.findClinics(page, size, search);
    const pagination = createPagination(page, size, totalItems);

    return {
      clinics: clinics.map((clinic) => this.mapToResponse(clinic)),
      pagination,
    };
  }

  private mapToResponse(clinic: {
    clinicId: string;
    clinicName: string | null;
    address: string | null;
    phones: string[];
    email: string | null;
    consultationFee: Decimal | null;
    clinicCode: string | null;
    clinicWorkingSessions?: {
      sessionType: Session;
      startTime: string;
      endTime: string;
    }[];
  }): ClinicResponseDto {
    return {
      clinicId: clinic.clinicId,
      clinicName: clinic.clinicName,
      address: clinic.address,
      phones: clinic.phones ?? [],
      email: clinic.email,
      consultationFee: clinic.consultationFee,
      clinicCode: clinic.clinicCode,
      sessions: (clinic.clinicWorkingSessions ?? []).map((session) => ({
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
      })),
    };
  }
}
