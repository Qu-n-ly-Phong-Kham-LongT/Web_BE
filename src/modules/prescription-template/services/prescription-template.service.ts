import { Prisma } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { PrescriptionTemplateResponseDto } from "../dtos/prescription-template.response.dto";
import { CreatePrescriptionTemplateRequestDto } from "../dtos/create-prescription-template.request.dto";
import { UpdatePrescriptionTemplateRequestDto } from "../dtos/update-prescription-template.request.dto";
import { PrescriptionTemplateListResponseDto } from "../dtos/prescription-template-list.response.dto";
import { PrescriptionTemplateRepository, PrescriptionTemplateWithDetails } from "../repositories/prescription-template.repository";
import { PrescriptionTemplateDetailRepository } from "../repositories/prescription-template-detail.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { createPagination } from "../../../utils/pagination.util";
import { prisma } from "../../../config/database.config";

export class PrescriptionTemplateService {
  private prescriptionTemplateRepository = new PrescriptionTemplateRepository();
  private prescriptionTemplateDetailRepository = new PrescriptionTemplateDetailRepository();
  private medicineRepository = new MedicineRepository();

  public async createPrescriptionTemplate(
    data: CreatePrescriptionTemplateRequestDto,
    createdBy?: string
  ): Promise<PrescriptionTemplateResponseDto> {
    // Kiểm tra thuốc trùng lặp
    const medicineIds = data.details.map((detail) => detail.medicineId);
    const uniqueMedicineIds = [...new Set(medicineIds)];
    if (uniqueMedicineIds.length !== medicineIds.length) {
      throw new BaseError(400, "Không được có thuốc trùng lặp trong cùng một mẫu đơn");
    }

    // Kiểm tra tất cả thuốc tồn tại
    const medicines = await this.medicineRepository.findMedicinesByIds(medicineIds);

    if (medicines.length !== medicineIds.length) {
      throw new BaseError(400, "Một hoặc nhiều thuốc không tồn tại");
    }

    const result = await this.prescriptionTemplateRepository.createPrescriptionTemplate(data, createdBy);
    return this.mapToResponseDto(result);
  }

  public async getPrescriptionTemplateById(id: string): Promise<PrescriptionTemplateResponseDto> {
    const template = await this.prescriptionTemplateRepository.findPrescriptionTemplateById(id);
    if (!template) {
      throw new BaseError(404, "Không tìm thấy mẫu đơn thuốc");
    }
    return this.mapToResponseDto(template);
  }

  public async getPrescriptionTemplates(
    page: number = 1,
    size: number = 10,
    search: string | undefined
  ): Promise<PrescriptionTemplateListResponseDto> {
    const { templates, totalItems } = await this.prescriptionTemplateRepository.findPrescriptionTemplates(
      page,
      size,
      search
    );

    const pagination = createPagination(page, size, totalItems);

    return {
      templates: templates.map((template) => this.mapToResponseDto(template)),
      pagination,
    };
  }

  public async updatePrescriptionTemplate(
    id: string,
    data: UpdatePrescriptionTemplateRequestDto
  ): Promise<PrescriptionTemplateResponseDto> {
    // Kiểm tra thuốc trùng lặp và kiểm tra thuốc tồn tại
    if (data.details !== undefined) {
      // Lấy mẫu đơn hiện tại để kiểm tra thuốc trùng lặp
      const existingTemplate = await this.prescriptionTemplateRepository.findPrescriptionTemplateById(id);
      if (!existingTemplate) {
        throw new BaseError(404, "Không tìm thấy mẫu đơn thuốc");
      }

      const existingDetailIds = existingTemplate.details.map((d) => d.templateDetailId);
      const detailsToUpdate = data.details.filter((d) => d.templateDetailId && existingDetailIds.includes(d.templateDetailId));
      const detailsToCreate = data.details.filter((d) => !d.templateDetailId);

      // Lấy tất cả medicineIds sẽ tồn tại sau khi cập nhật (cập nhật + tạo mới)
      const medicineIdsFromUpdates = detailsToUpdate.map((d) => d.medicineId);
      const medicineIdsFromCreates = detailsToCreate.map((d) => d.medicineId);
      const allMedicineIdsAfterUpdate = [...medicineIdsFromUpdates, ...medicineIdsFromCreates];

      // Kiểm tra thuốc trùng lặp
      const uniqueMedicineIds = [...new Set(allMedicineIdsAfterUpdate)];
      if (uniqueMedicineIds.length !== allMedicineIdsAfterUpdate.length) {
        throw new BaseError(400, "Không được có thuốc trùng lặp trong cùng một mẫu đơn");
      }

      // Kiểm tra tất cả thuốc tồn tại
      const medicines = await this.medicineRepository.findMedicinesByIds(allMedicineIdsAfterUpdate);
      if (medicines.length !== allMedicineIdsAfterUpdate.length) {
        throw new BaseError(400, "Một hoặc nhiều thuốc không tồn tại");
      }
    }

    // Chuyển logic cập nhật đến repository
    const result = await this.prescriptionTemplateRepository.updatePrescriptionTemplate(
      id,
      {
        templateName: data.templateName,
        description: data.description,
        details: data.details,
      }
    );

    if (!result) {
      throw new BaseError(404, "Không tìm thấy mẫu đơn thuốc");
    }

    return this.mapToResponseDto(result);
  }

  private mapToResponseDto(template: PrescriptionTemplateWithDetails): PrescriptionTemplateResponseDto {
    return {
      templateId: template.templateId,
      templateName: template.templateName,
      description: template.description,
      createdBy: template.createdBy,
      creatorName: template.creator?.fullName ?? null,
      details: template.details.map((detail) => ({
        templateDetailId: detail.templateDetailId,
        medicineId: detail.medicineId,
        medicineName: detail.medicine?.medicineName ?? null,
        baseUnit: detail.medicine?.baseUnit ?? null,
        defaultFrequency: detail.defaultFrequency,
        defaultQuantityPerTime: detail.defaultQuantityPerTime ? Number(detail.defaultQuantityPerTime) : null,
        defaultRoute: detail.defaultRoute,
        defaultTiming: detail.defaultTiming,
      })),
    };
  }
}

