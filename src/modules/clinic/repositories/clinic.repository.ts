import { prisma } from "../../../config/database.config";
import { Prisma, Clinic } from "@prisma/client";

export class ClinicRepository {
  public async findClinicById(id: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { clinicId: id } });
  }

  public async findClinicByCode(code: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { clinicCode: code } });
  }

  public async findClinicByEmail(email: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { email: email } });
  }

  public async createClinic(
    createData: Prisma.ClinicCreateInput
  ): Promise<Clinic> {
    return await prisma.clinic.create({
      data: createData,
    });
  }

  public async updateClinic(
    id: string,
    updateData: Prisma.ClinicUpdateInput
  ): Promise<Clinic> {
    return await prisma.clinic.update({
      where: { clinicId: id },
      data: updateData,
    });
  }
}
