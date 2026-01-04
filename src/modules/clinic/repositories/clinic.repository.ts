import { prisma } from "../../../config/database.config";
import { Clinic } from "@prisma/client";

export class ClinicRepository {
  public async findClinicById(id: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { clinicId: id } });
  }
}
