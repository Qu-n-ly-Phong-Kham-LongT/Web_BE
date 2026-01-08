import { Prisma, PrescriptionTemplateDetail } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { PrescriptionTemplateResponseDto } from "../dtos/prescription-template.response.dto";
import { CreatePrescriptionTemplateRequestDto } from "../dtos/create-prescription-template.request.dto";
import { UpdatePrescriptionTemplateRequestDto } from "../dtos/update-prescription-template.request.dto";
import { PrescriptionTemplateListResponseDto } from "../dtos/prescription-template-list.response.dto";
import {
  PrescriptionTemplateRepository,
  PrescriptionTemplateWithDetails,
} from "../repositories/prescription-template.repository";
import { PrescriptionTemplateDetailRepository } from "../repositories/prescription-template-detail.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { createPagination } from "../../../utils/pagination.util";
import { prisma } from "../../../config/database.config";

export class PrescriptionTemplateService {
  private templateRepository = new PrescriptionTemplateRepository();
  private detailRepository = new PrescriptionTemplateDetailRepository();
  private medicineRepository = new MedicineRepository();

  public async createPrescriptionTemplate(
    data: CreatePrescriptionTemplateRequestDto,
    createdBy?: string
  ): Promise<PrescriptionTemplateResponseDto> {
    // Business validation: Kiểm tra thuốc trùng lặp
    const medicineIds = data.details.map((detail) => detail.medicineId);
    const uniqueMedicineIds = [...new Set(medicineIds)];
    if (uniqueMedicineIds.length !== medicineIds.length) {
      throw new BaseError(400, "Không được có thuốc trùng lặp trong cùng một mẫu đơn");
    }

    // Business validation: Kiểm tra tất cả thuốc tồn tại
    const medicines = await this.medicineRepository.findMedicinesByIds(medicineIds);
    if (medicines.length !== medicineIds.length) {
      throw new BaseError(400, "Một hoặc nhiều thuốc không tồn tại");
    }

    // Delegate to repository
    const result = await this.templateRepository.createPrescriptionTemplate(
      {
        templateName: data.templateName,
        description: data.description,
        details: data.details,
      },
      createdBy
    );

    return this.mapToResponseDto(result);
  }

  public async getPrescriptionTemplateById(id: string): Promise<PrescriptionTemplateResponseDto> {
    const template = await this.templateRepository.findPrescriptionTemplateById(id);
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
    const { templates, totalItems } = await this.templateRepository.findPrescriptionTemplates(
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
    // Step 1: Get existing template
    const existingTemplate = await this.templateRepository.findPrescriptionTemplateById(id);
    if (!existingTemplate) {
      throw new BaseError(404, "Không tìm thấy mẫu đơn thuốc");
    }

    // Step 2: Business logic - Classify details if provided
    if (data.details !== undefined) {
      const existingDetailIds = existingTemplate.details.map((d) => d.templateDetailId);

      // Classify: update vs create
      const detailsToUpdate = data.details.filter(
        (d) => d.templateDetailId && existingDetailIds.includes(d.templateDetailId)
      );
      const detailsToCreate = data.details.filter((d) => !d.templateDetailId);

      // Determine which details to delete (IDs in DB but not in request)
      const newDetailIds = data.details
        .filter((d) => d.templateDetailId)
        .map((d) => d.templateDetailId!);
      const detailIdsToDelete = existingDetailIds.filter((id) => !newDetailIds.includes(id));

      // Business validation: Check duplicate medicines
      const allMedicineIds = data.details.map((d) => d.medicineId);
      const uniqueMedicineIds = [...new Set(allMedicineIds)];
      if (uniqueMedicineIds.length !== allMedicineIds.length) {
        throw new BaseError(400, "Không được có thuốc trùng lặp trong cùng một mẫu đơn");
      }

      // Business validation: Check all medicines exist
      const medicines = await this.medicineRepository.findMedicinesByIds(allMedicineIds);
      if (medicines.length !== allMedicineIds.length) {
        throw new BaseError(400, "Một hoặc nhiều thuốc không tồn tại");
      }

      // Step 3: Execute transaction - Orchestrate repository calls
      await prisma.$transaction(async (tx) => {
        // 1. Build header update data - chỉ chứa fields có giá trị
        const headerUpdateData: Prisma.PrescriptionTemplateUpdateInput = {};

        if (data.templateName !== undefined) {
          headerUpdateData.templateName = data.templateName;
        }
        if (data.description !== undefined) {
          headerUpdateData.description = data.description;
        }

        // Chỉ update nếu có ít nhất 1 field
        if (Object.keys(headerUpdateData).length > 0) {
          await this.templateRepository.updateTemplateHeader(id, headerUpdateData, tx);
        }

        // 2. Delete removed details
        if (detailIdsToDelete.length > 0) {
          await this.detailRepository.deleteTemplateDetailsByIds(detailIdsToDelete, tx);
        }

        // 3. Create new details
        if (detailsToCreate.length > 0) {
          await this.detailRepository.createManyTemplateDetails(
            id,
            detailsToCreate.map((d) => ({
              medicineId: d.medicineId,
              defaultFrequency: d.defaultFrequency ?? null,
              defaultQuantityPerTime: d.defaultQuantityPerTime ?? null,
              daysToTake: d.daysToTake ?? null,
              defaultRoute: d.defaultRoute ?? null,
              defaultTiming: d.defaultTiming ?? null,
            })),
            tx
          );
        }

        // 4. Update existing details
        for (const detail of detailsToUpdate) {
          await this.detailRepository.updateTemplateDetail(
            detail.templateDetailId!,
            {
              medicineId: detail.medicineId,
              defaultFrequency: detail.defaultFrequency ?? null,
              defaultQuantityPerTime: detail.defaultQuantityPerTime ?? null,
              daysToTake: detail.daysToTake ?? null,
              defaultRoute: detail.defaultRoute ?? null,
              defaultTiming: detail.defaultTiming ?? null,
            },
            tx
          );
        }
      });
    } else {
      // Only update header, no details change
      // Build header update data - chỉ chứa fields có giá trị
      const headerUpdateData: Prisma.PrescriptionTemplateUpdateInput = {};

      if (data.templateName !== undefined) {
        headerUpdateData.templateName = data.templateName;
      }
      if (data.description !== undefined) {
        headerUpdateData.description = data.description;
      }

      // Chỉ update nếu có ít nhất 1 field
      if (Object.keys(headerUpdateData).length > 0) {
        await this.templateRepository.updateTemplateHeader(id, headerUpdateData);
      }
    }

    // Step 4: Return updated template
    const result = await this.templateRepository.findPrescriptionTemplateById(id);
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
        daysToTake: detail.daysToTake ?? null,
        defaultRoute: detail.defaultRoute,
        defaultTiming: detail.defaultTiming,
      })),
    };
  }
}
