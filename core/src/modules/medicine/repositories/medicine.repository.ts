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
    clinicId?: string,
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
    clinicId?: string,
  ): Promise<Medicine | null> {
    return await prisma.medicine.findFirst({
      where: {
        medicineId: id,
        deletedAt: null,
        ...this.buildClinicFilter(clinicId),
      },
    });
  }

  public async findMedicines(
    page: number = 1,
    size: number = 10,
    search?: string,
    clinicId?: string,
    options: {
      supplier?: string;
      isActive?: boolean;
      isInsuranceCovered?: boolean;
      sellPrice?: number;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: "medicineName" | "sellPrice" | "createdAt" | "medicineCode";
      sort?: "asc" | "desc";
    } = {},
  ): Promise<{ medicines: Medicine[]; totalItems: number }> {
    const skip = (page - 1) * size;

    const baseWhere = {
      deletedAt: null,
      ...this.buildClinicFilter(clinicId),
    };

    const supplierFilter = options.supplier?.trim();
    const priceFilter: Prisma.MedicineWhereInput = {};
    if (options.sellPrice !== undefined) {
      priceFilter.sellPrice = new Prisma.Decimal(options.sellPrice);
    } else if (
      options.minPrice !== undefined ||
      options.maxPrice !== undefined
    ) {
      priceFilter.sellPrice = {
        ...(options.minPrice !== undefined
          ? { gte: new Prisma.Decimal(options.minPrice) }
          : {}),
        ...(options.maxPrice !== undefined
          ? { lte: new Prisma.Decimal(options.maxPrice) }
          : {}),
      };
    }

    const where = search
      ? {
          ...baseWhere,
          ...(supplierFilter
            ? {
                supplier: {
                  contains: supplierFilter,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(options.isActive === undefined
            ? {}
            : { isActive: options.isActive }),
          ...(options.isInsuranceCovered === undefined
            ? {}
            : { isInsuranceCovered: options.isInsuranceCovered }),
          ...priceFilter,
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
              supplier: { contains: search, mode: "insensitive" as const },
            },
            // {
            //   registrationNo: {
            //     contains: search,
            //     mode: "insensitive" as const,
            //   },
            // },
            // {
            //   medicineCodeBhyt: {
            //     contains: search,
            //     mode: "insensitive" as const,
            //   },
            // },
            // { supplier: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    if (!search) {
      if (supplierFilter) {
        (where as Prisma.MedicineWhereInput).supplier = {
          contains: supplierFilter,
          mode: "insensitive" as const,
        };
      }
      if (options.isActive !== undefined) {
        (where as Prisma.MedicineWhereInput).isActive = options.isActive;
      }
      if (options.isInsuranceCovered !== undefined) {
        (where as Prisma.MedicineWhereInput).isInsuranceCovered =
          options.isInsuranceCovered;
      }
      if (priceFilter.sellPrice) {
        (where as Prisma.MedicineWhereInput).sellPrice = priceFilter.sellPrice;
      }
    }

    const sortBy = options.sortBy ?? "createdAt";
    const sortDirection = options.sort ?? "desc";
    const primaryOrderBy: Prisma.MedicineOrderByWithRelationInput =
      sortBy === "createdAt"
        ? { createdAt: sortDirection }
        : ({
            [sortBy]: sortDirection,
          } as Prisma.MedicineOrderByWithRelationInput);
    const orderBy:
      | Prisma.MedicineOrderByWithRelationInput
      | Prisma.MedicineOrderByWithRelationInput[] =
      sortBy === "createdAt"
        ? primaryOrderBy
        : [primaryOrderBy, { createdAt: "desc" as Prisma.SortOrder }];

    const [medicines, totalItems] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, totalItems };
  }

  public async updateMedicine(
    id: string,
    data: Prisma.MedicineUpdateInput,
    clinicId?: string,
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
    medicineCode: string,
  ): Promise<Medicine | null> {
    return await prisma.medicine.findFirst({
      where: { medicineCode: medicineCode, deletedAt: null },
    });
  }

  public async findMedicinesByIds(
    medicineIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<
    Pick<
      Medicine,
      | "medicineId"
      | "sellPrice"
      | "medicineName"
      | "isInsuranceCovered"
      | "insurancePrice"
    >[]
  > {
    const client = tx || prisma;

    return await client.medicine.findMany({
      where: {
        medicineId: { in: medicineIds },
        deletedAt: null,
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

  public async decrementStockIfEnough(
    medicineId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.medicine.updateMany({
      where: {
        medicineId: medicineId,
        deletedAt: null,
        totalQuantity: { gte: quantity },
      },
      data: { totalQuantity: { decrement: quantity } },
    });
  }

  public async decrementStockForce(
    medicineId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.medicine.update({
      where: { medicineId, deletedAt: null },
      data: { totalQuantity: { decrement: quantity } },
    });
  }

  public async markDispensed(
    prescriptionId: string,
    userId: string,
    totalPrice: number,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.prescription.update({
      where: { prescriptionId },
      data: {
        isDispensed: true,
        dispensedAt: new Date(),
        dispensedBy: userId,
        totalPrice: new Prisma.Decimal(totalPrice),
      },
    });
  }

  public async createInventoryLog(
    data: Prisma.InventoryLogCreateManyInput,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.inventoryLog.create({
      data: data,
    });
  }

  public async setStockToZero(
    medicineId: string,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.medicine.update({
      where: { medicineId, deletedAt: null },
      data: { totalQuantity: 0 },
    });
  }
}
