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

  public async findClinics(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<{ clinics: Clinic[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const where = search
      ? {
          OR: [
            { clinicName: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { clinicCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [clinics, totalItems] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: size,
        orderBy: { clinicCode: "asc" },
      }),
      prisma.clinic.count({ where }),
    ]);

    return { clinics, totalItems };
  }

  public async findClinicCodeByClinicId(clinicId: string): Promise<any> {
    const clinic = await prisma.clinic.findUnique({
      where: { clinicId: clinicId },
      select: { clinicCode: true },
    });
    return clinic;
  }
}
