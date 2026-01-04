import { ClinicRepository } from "../repositories/clinic.repository";
import { BaseError } from "../../../utils/base-error.util";
import { Clinic } from "@prisma/client";

export class ClinicService {
  private clinicRepository = new ClinicRepository();

  public async getClinicById(id: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findClinicById(id);
    if (!clinic) {
      throw new BaseError(404, "Phòng khám không tồn tại.");
    }
    return clinic;
  }
}
