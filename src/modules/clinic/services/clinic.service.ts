import { ClinicRepository } from "../repositories/clinic.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicRequestDto } from "../dtos/clinic.request.dto";
import { ClinicResponseDto } from "../dtos/clinic.response.dto";

export class ClinicService {
  private clinicRepository = new ClinicRepository();

  public async getClinicById(id: string): Promise<ClinicResponseDto> {
    const clinic = await this.clinicRepository.findClinicById(id);
    if (!clinic) {
      throw new BaseError(404, "Phòng khám không tồn tại.");
    }
    return clinic;
  }

  public async createClinic(
    createData: ClinicRequestDto
  ): Promise<ClinicResponseDto> {
    const existingClinic = await this.clinicRepository.findClinicByEmail(
      createData.email
    );

    if (existingClinic) {
      throw new BaseError(409, "Phòng khám đã tồn tại.");
    }

    return await this.clinicRepository.createClinic({
      clinicName: createData.clinicName,
      address: createData.address,
      phone: createData.phone,
      email: createData.email,
    });
  }

  public async updateClinic(
    id: string,
    updateData: ClinicRequestDto
  ): Promise<ClinicResponseDto> {
    const clinicToUpdate = await this.clinicRepository.findClinicById(id);
    if (!clinicToUpdate) {
      throw new BaseError(404, "Phòng khám không tồn tại");
    }

    if (updateData.email && updateData.email !== clinicToUpdate.email) {
      const duplicateCheck = await this.clinicRepository.findClinicByEmail(
        updateData.email
      );
      if (duplicateCheck && duplicateCheck.email !== id) {
        throw new BaseError(
          409,
          "Email này đang được sử dụng bởi 1 phòng khám khác."
        );
      }
    }

    return await this.clinicRepository.updateClinic(id, {
      clinicName: updateData.clinicName,
      address: updateData.address,
      phone: updateData.phone,
      email: updateData.email,
    });
  }
}
