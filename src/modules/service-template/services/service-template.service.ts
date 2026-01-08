import { Prisma, ServiceTemplateDetail } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { ServiceTemplateResponseDto } from "../dtos/service-template.response.dto";
import { CreateServiceTemplateRequestDto } from "../dtos/create-service-template.request.dto";
import { UpdateServiceTemplateRequestDto } from "../dtos/update-service-template.request.dto";
import { ServiceTemplateListResponseDto } from "../dtos/service-template-list.response.dto";
import {
  ServiceTemplateRepository,
  ServiceTemplateWithDetails,
} from "../repositories/service-template.repository";
import { ServiceTemplateDetailRepository } from "../repositories/service-template-detail.repository";
import { ServiceItemRepository } from "../../service-item/repositories/service-item.request.repository";
import { createPagination } from "../../../utils/pagination.util";
import { prisma } from "../../../config/database.config";

export class ServiceTemplateService {
  private templateRepository = new ServiceTemplateRepository();
  private detailRepository = new ServiceTemplateDetailRepository();
  private serviceItemRepository = new ServiceItemRepository();

  public async createServiceTemplate(
    data: CreateServiceTemplateRequestDto
  ): Promise<ServiceTemplateResponseDto> {
    // Business validation: Kiểm tra dịch vụ trùng lặp
    const itemIds = data.details.map((detail) => detail.itemId);
    const uniqueItemIds = [...new Set(itemIds)];
    if (uniqueItemIds.length !== itemIds.length) {
      throw new BaseError(400, "Không được có dịch vụ trùng lặp trong cùng một mẫu");
    }

    // Business validation: Kiểm tra tất cả dịch vụ tồn tại
    const serviceItems = await this.serviceItemRepository.findServiceItemsByIds(itemIds);
    if (serviceItems.length !== itemIds.length) {
      throw new BaseError(400, "Một hoặc nhiều dịch vụ không tồn tại");
    }

    // Delegate to repository
    const result = await this.templateRepository.createServiceTemplate({
      templateName: data.templateName,
      description: data.description,
      isActive: data.isActive,
      details: data.details,
    });

    return this.mapToResponseDto(result);
  }

  public async getServiceTemplateById(id: string): Promise<ServiceTemplateResponseDto> {
    const template = await this.templateRepository.findServiceTemplateById(id);
    if (!template) {
      throw new BaseError(404, "Không tìm thấy mẫu dịch vụ");
    }
    return this.mapToResponseDto(template);
  }

  public async getServiceTemplates(
    page: number = 1,
    size: number = 10,
    search: string | undefined
  ): Promise<ServiceTemplateListResponseDto> {
    const { templates, totalItems } = await this.templateRepository.findServiceTemplates(
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

  public async updateServiceTemplate(
    id: string,
    data: UpdateServiceTemplateRequestDto
  ): Promise<ServiceTemplateResponseDto> {
    // Step 1: Get existing template
    const existingTemplate = await this.templateRepository.findServiceTemplateById(id);
    if (!existingTemplate) {
      throw new BaseError(404, "Không tìm thấy mẫu dịch vụ");
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

      // Business validation: Check duplicate service items
      const allItemIds = data.details.map((d) => d.itemId);
      const uniqueItemIds = [...new Set(allItemIds)];
      if (uniqueItemIds.length !== allItemIds.length) {
        throw new BaseError(400, "Không được có dịch vụ trùng lặp trong cùng một mẫu");
      }

      // Business validation: Check all service items exist
      const serviceItems = await this.serviceItemRepository.findServiceItemsByIds(allItemIds);
      if (serviceItems.length !== allItemIds.length) {
        throw new BaseError(400, "Một hoặc nhiều dịch vụ không tồn tại");
      }

      // Step 3: Execute transaction - Orchestrate repository calls
      await prisma.$transaction(async (tx) => {
        // 1. Build header update data - chỉ chứa fields có giá trị
        const headerUpdateData: Prisma.ServiceTemplateUpdateInput = {};

        if (data.templateName !== undefined) {
          headerUpdateData.templateName = data.templateName;
        }
        if (data.description !== undefined) {
          headerUpdateData.description = data.description;
        }
        if (data.isActive !== undefined) {
          headerUpdateData.isActive = data.isActive;
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
              itemId: d.itemId,
              note: d.note ?? null,
            })),
            tx
          );
        }

        // 4. Update existing details
        for (const detail of detailsToUpdate) {
          await this.detailRepository.updateTemplateDetail(
            detail.templateDetailId!,
            {
              itemId: detail.itemId,
              note: detail.note ?? null,
            },
            tx
          );
        }
      });
    } else {
      // Only update header, no details change
      // Build header update data - chỉ chứa fields có giá trị
      const headerUpdateData: Prisma.ServiceTemplateUpdateInput = {};

      if (data.templateName !== undefined) {
        headerUpdateData.templateName = data.templateName;
      }
      if (data.description !== undefined) {
        headerUpdateData.description = data.description;
      }
      if (data.isActive !== undefined) {
        headerUpdateData.isActive = data.isActive;
      }

      // Chỉ update nếu có ít nhất 1 field
      if (Object.keys(headerUpdateData).length > 0) {
        await this.templateRepository.updateTemplateHeader(id, headerUpdateData);
      }
    }

    // Step 4: Return updated template
    const result = await this.templateRepository.findServiceTemplateById(id);
    if (!result) {
      throw new BaseError(404, "Không tìm thấy mẫu dịch vụ");
    }

    return this.mapToResponseDto(result);
  }

  private mapToResponseDto(template: ServiceTemplateWithDetails): ServiceTemplateResponseDto {
    return {
      templateId: template.templateId,
      templateName: template.templateName ?? "",
      description: template.description,
      isActive: template.isActive,
      details: template.details.map((detail) => ({
        templateDetailId: detail.templateDetailId,
        itemId: detail.itemId!,
        itemName: detail.serviceItem?.name ?? null,
        itemCode: detail.serviceItem?.itemCode ?? null,
        unit: detail.serviceItem?.unit ?? null,
        note: detail.note,
      })),
    };
  }
}

