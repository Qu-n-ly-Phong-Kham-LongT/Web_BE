import { prisma } from "../../../config/database.config";
import { ClinicRequestDto } from "../dtos/clinic.request.dto";

export class ClinicRepository {
  public async findClinicById(id: string) {
    return prisma.clinic.findUnique({
      where: { clinicId: id },
      include: { clinicWorkingSessions: { orderBy: { sessionType: "asc" } } },
    });
  }

  public async findClinicByCode(code: string) {
    return prisma.clinic.findUnique({ where: { clinicCode: code } });
  }

  public async createClinic(createData: ClinicRequestDto) {
    const sessions = createData.sessions ?? [];
    const data = {
      clinicName: createData.clinicName,
      address: createData.address,
      phones: createData.phones ?? [],
      email: createData.email,
      ...(sessions.length
        ? {
            clinicWorkingSessions: {
              create: sessions.map((session) => ({
                sessionType: session.sessionType,
                startTime: session.startTime,
                endTime: session.endTime,
              })),
            },
          }
        : {}),
    };

    return await prisma.clinic.create({
      data,
      include: { clinicWorkingSessions: { orderBy: { sessionType: "asc" } } },
    });
  }

  public async updateClinic(id: string, updateData: ClinicRequestDto) {
    const data = {
      clinicName: updateData.clinicName,
      address: updateData.address,
      email: updateData.email,
      consultationFee: updateData.consultationFee,
      ...(typeof updateData.phones !== "undefined"
        ? { phones: updateData.phones }
        : {}),
      ...(updateData.sessions
        ? {
            clinicWorkingSessions: {
              deleteMany: {},
              create: updateData.sessions.map((session) => ({
                sessionType: session.sessionType,
                startTime: session.startTime,
                endTime: session.endTime,
              })),
            },
          }
        : {}),
    };

    return await prisma.clinic.update({
      where: { clinicId: id },
      data,
      include: { clinicWorkingSessions: { orderBy: { sessionType: "asc" } } },
    });
  }

  public async findClinics(
    page: number = 1,
    size: number = 10,
    search?: string
  ) {
    const skip = (page - 1) * size;

    const where = search
      ? {
          OR: [
            { clinicName: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search, mode: "insensitive" as const } },
            { phones: { has: search } },
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
        include: { clinicWorkingSessions: { orderBy: { sessionType: "asc" } } },
      }),
      prisma.clinic.count({ where }),
    ]);

    return { clinics, totalItems };
  }

  public async findClinicCodeByClinicId(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { clinicId: clinicId },
      select: { clinicCode: true },
    });
    return clinic;
  }
}
