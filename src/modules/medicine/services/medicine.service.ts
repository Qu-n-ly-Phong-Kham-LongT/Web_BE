import { Medicine, Prisma } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { MedicineResponseDto } from "../dtos/medicine.response.dto";
import { CreateMedicineRequestDto } from "../dtos/create-medicine.request.dto";
import { UpdateMedicineRequestDto } from "../dtos/update-medicine.request.dto";
import { MedicineListResponseDto } from "../dtos/medicine-list.response.dto";
import { MedicineRepository } from "../repositories/medicine.repository";
import { createPagination } from "../../../utils/pagination.util";

export class MedicineService {
  private medicineRepository = new MedicineRepository();

  public async createMedicine(data: CreateMedicineRequestDto, clinicId: string): Promise<MedicineResponseDto> {
    // Check if medicineCode already exists
    const existingMedicine = await this.medicineRepository.findMedicineByCode(data.medicineCode);
    if (existingMedicine) {
      throw new BaseError(400, "Mã thuốc đã tồn tại");
    }

    let result = await this.medicineRepository.createMedicine(data, clinicId);
    return this.mapToResponseDto(result);
  }

  public async getMedicineById(id: string, clinicId: string): Promise<MedicineResponseDto> {
    let medicine = await this.medicineRepository.findMedicineById(id, clinicId);
    if (!medicine) {
      throw new BaseError(404, "Không tìm thấy thuốc");
    }
    return this.mapToResponseDto(medicine);
  }

  public async getMedicines(
    page: number = 1,
    size: number = 10,
    search: string | undefined,
    clinicId: string
  ): Promise<MedicineListResponseDto> {
    let { medicines, totalItems } = await this.medicineRepository.findMedicines(page, size, search, clinicId);

    let pagination = createPagination(page, size, totalItems);

    return {
      medicines: medicines.map((medicine) => this.mapToResponseDto(medicine)),
      pagination,
    };
  }

  public async updateMedicine(id: string, data: UpdateMedicineRequestDto, clinicId: string): Promise<MedicineResponseDto> {
    let existingMedicine = await this.medicineRepository.findMedicineById(id, clinicId);
    if (!existingMedicine) {
      throw new BaseError(404, "Không tìm thấy thuốc");
    }

    const updateData: Prisma.MedicineUpdateInput = {};

    if (data.medicineCode !== undefined && data.medicineCode !== existingMedicine.medicineCode) {
      // Check if new medicineCode already exists
      const existingByCode = await this.medicineRepository.findMedicineByCode(data.medicineCode);
      if (existingByCode) {
        throw new BaseError(400, "Mã thuốc đã tồn tại");
      }
      updateData.medicineCode = data.medicineCode;
    }

    if (data.medicineName !== undefined) {
      updateData.medicineName = data.medicineName;
    }

    if (data.activeIngredient !== undefined) {
      updateData.activeIngredient = data.activeIngredient;
    }

    if (data.registrationNo !== undefined) {
      updateData.registrationNo = data.registrationNo;
    }

    if (data.isInsuranceCovered !== undefined) {
      updateData.isInsuranceCovered = data.isInsuranceCovered;
    }

    if (data.medicineCodeBhyt !== undefined) {
      updateData.medicineCodeBhyt = data.medicineCodeBhyt;
    }

    if (data.insurancePrice !== undefined) {
      updateData.insurancePrice = data.insurancePrice ? new Prisma.Decimal(data.insurancePrice) : null;
    }

    if (data.baseUnit !== undefined) {
      updateData.baseUnit = data.baseUnit;
    }

    if (data.totalQuantity !== undefined) {
      updateData.totalQuantity = data.totalQuantity;
    }

    if (data.sellPrice !== undefined) {
      updateData.sellPrice = data.sellPrice ? new Prisma.Decimal(data.sellPrice) : null;
    }

    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    if (data.supplier !== undefined) {
      updateData.supplier = data.supplier;
    }

    if (data.sideEffects !== undefined) {
      updateData.sideEffects = data.sideEffects;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    let result = await this.medicineRepository.updateMedicine(id, updateData, clinicId);
    if (!result) {
      throw new BaseError(404, "Không tìm thấy thuốc");
    }
    return this.mapToResponseDto(result);
  }

  private mapToResponseDto(medicine: Medicine): MedicineResponseDto {
    return {
      medicineID: medicine.medicineId,
      medicineCode: medicine.medicineCode ?? "",
      medicineName: medicine.medicineName ?? "",
      activeIngredient: medicine.activeIngredient,
      registrationNo: medicine.registrationNo,
      isInsuranceCovered: medicine.isInsuranceCovered,
      medicineCodeBhyt: medicine.medicineCodeBhyt,
      insurancePrice: medicine.insurancePrice ? Number(medicine.insurancePrice) : 0,
      baseUnit: medicine.baseUnit,
      totalQuantity: medicine.totalQuantity ?? 0,
      sellPrice: medicine.sellPrice ? Number(medicine.sellPrice) : 0,
      note: medicine.note,
      supplier: medicine.supplier,
      sideEffects: medicine.sideEffects,
      isActive: medicine.isActive,
      createdAt: medicine.createdAt ? medicine.createdAt.toISOString() : ""
    };
  }
}

