import { Prisma, Medicine } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { CreateMedicineRequestDto } from "../dtos/create-medicine.request.dto";

export class MedicineRepository {
  private buildClinicFilter(clinicId?: string): { clinicId: string } | {} {
    if (clinicId) {
      return {
        clinicId: clinicId,
      };
    }
    return {};
  }

  public async createMedicine(
    data: CreateMedicineRequestDto,
    clinicId?: string
  ): Promise<Medicine> {
    return await prisma.medicine.create({
      data: {
        medicineCode: data.medicineCode,
        medicineName: data.medicineName,
        activeIngredient: data.activeIngredient ?? null,
        registrationNo: data.registrationNo ?? null,
        isInsuranceCovered: data.isInsuranceCovered ?? false,
        medicineCodeBhyt: data.medicineCodeBhyt ?? null,
        insurancePrice: data.insurancePrice
          ? new Prisma.Decimal(data.insurancePrice)
          : null,
        baseUnit: data.baseUnit ?? null,
        totalQuantity: data.totalQuantity ?? 0,
        sellPrice: data.sellPrice ? new Prisma.Decimal(data.sellPrice) : null,
        note: data.note ?? null,
        supplier: data.supplier ?? null,
        sideEffects: data.sideEffects ?? null,
        isActive: data.isActive ?? true,
        clinicId: clinicId,
      },
    });
  }

  public async findMedicineById(
    id: string,
    clinicId?: string
  ): Promise<Medicine | null> {
    return await prisma.medicine.findFirst({
      where: {
        medicineId: id,
        ...this.buildClinicFilter(clinicId),
      },
    });
  }

  public async findMedicines(
    page: number = 1,
    size: number = 10,
    search?: string,
    clinicId?: string
  ): Promise<{ medicines: Medicine[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const baseWhere = {
      ...this.buildClinicFilter(clinicId),
    };

    const where = search
      ? {
          ...baseWhere,
          OR: [
            {
              medicineName: { contains: search, mode: "insensitive" as const },
            },
            {
              medicineCode: { contains: search, mode: "insensitive" as const },
            },
            {
              activeIngredient: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              registrationNo: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              medicineCodeBhyt: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            { supplier: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const [medicines, totalItems] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, totalItems };
  }

  public async updateMedicine(
    id: string,
    data: Prisma.MedicineUpdateInput,
    clinicId?: string
  ): Promise<Medicine | null> {
    // First check if medicine exists with clinic filter
    const existing = await prisma.medicine.findFirst({
      where: {
        medicineId: id,
        ...this.buildClinicFilter(clinicId),
      },
    });

    if (!existing) {
      return null;
    }

    // Update the medicine
    return await prisma.medicine.update({
      where: { medicineId: id },
      data: data,
    });
  }

  public async findMedicineByCode(
    medicineCode: string
  ): Promise<Medicine | null> {
    return await prisma.medicine.findUnique({
      where: { medicineCode: medicineCode },
    });
  }

  public async findMedicinesByIds(
    medicineIds: string[],
    tx?: Prisma.TransactionClient
  ): Promise<
    Pick<
      Medicine,
      "medicineId" | "sellPrice" | "medicineName" | "isInsuranceCovered" | "insurancePrice"
    >[]
  > {
    const client = tx || prisma;

    return await client.medicine.findMany({
      where: {
        medicineId: { in: medicineIds },
      },
      select: {
        medicineId: true,
        sellPrice: true,
        medicineName: true,
        isInsuranceCovered: true,
        insurancePrice: true,
      },
    });
  }
}
