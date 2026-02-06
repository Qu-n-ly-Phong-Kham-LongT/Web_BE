import { ServiceNodeRepository } from "../../service-node/repositories/service-node.repository";
import {
  CreateServiceItemRequestDto,
  UpdateServiceItemRequestDto,
} from "../dtos/service-item.request.dto";
import { ServiceItemRepository } from "../repositories/service-item.request.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ServiceItemResponseDto } from "../dtos/service-item.response.dto";
import { createPagination } from "../../../utils/pagination.util";
import { Prisma } from "@prisma/client";
import { ServiceTemplateDetailRepository } from "../../service-template/repositories/service-template-detail.repository";
import { prisma } from "../../../config/database.config";

export class ServiceItemService {
  private serviceNodeRepository = new ServiceNodeRepository();
  private serviceItemRepository = new ServiceItemRepository();
  private serviceTemplateDetailRepository =
    new ServiceTemplateDetailRepository();

  public async getItemById(id: string) {
    const item = await this.serviceItemRepository.findById(id);
    if (!item) {
      throw new BaseError(404, "Không tìm thấy dịch vụ");
    }
    return this.mapToResponseDto(item);
  }

  public async getAllItems(
    page: number,
    size: number,
    search?: string,
    typeId?: string,
    categoryId?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * size;

    const { items, total } = await this.serviceItemRepository.findAll({
      skip,
      take: size,
      search,
      typeId,
      categoryId,
      isActive,
    });

    const pagination = createPagination(page, size, total);

    return {
      data: items.map((item) => this.mapToResponseDto(item)),
      pagination,
    };
  }

  public async createItem(createData: CreateServiceItemRequestDto) {
    const existingItem = await this.serviceItemRepository.findByCode(
      createData.itemCode,
    );
    if (existingItem) {
      throw new BaseError(409, "Dịch vụ này đã tồn tại");
    }

    const typeNode = await this.serviceNodeRepository.findNodeById(
      createData.typeId,
    );
    if (!typeNode) {
      throw new BaseError(409, "Loại dịch vụ này không tồn tại");
    }

    if (createData.categoryId) {
      const categoryNode = await this.serviceNodeRepository.findNodeById(
        createData.categoryId,
      );
      if (!categoryNode) {
        throw new BaseError(409, "Danh mục dịch vụ này không tồn tại");
      }
    }

    return await this.serviceItemRepository.createServiceItemWithConfig(
      createData,
    );
  }

  public async updateItem(itemId: string, data: UpdateServiceItemRequestDto) {
    const existingItem = await this.serviceItemRepository.findById(itemId);
    if (!existingItem) {
      throw new BaseError(404, "Không tìm thấy dịch vụ CLS");
    }

    if (
      data.itemCode !== undefined &&
      data.itemCode !== existingItem.itemCode
    ) {
      const existingByCode = await this.serviceItemRepository.findByCode(
        data.itemCode,
      );
      if (existingByCode && existingByCode.itemId !== itemId) {
        throw new BaseError(409, "Dịch vụ này đã tồn tại");
      }
    }

    if (data.typeId) {
      const typeNode = await this.serviceNodeRepository.findNodeById(
        data.typeId,
      );
      if (!typeNode) {
        throw new BaseError(409, "Loại dịch vụ này không tồn tại");
      }
    }

    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        // allow clearing category
      } else {
        const categoryNode = await this.serviceNodeRepository.findNodeById(
          data.categoryId,
        );
        if (!categoryNode) {
          throw new BaseError(409, "Danh mục dịch vụ này không tồn tại");
        }
      }
    }

    const updateData: Prisma.ServiceItemUpdateInput = {};

    if (data.itemCode !== undefined) {
      updateData.itemCode = data.itemCode;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.categoryId !== undefined) {
      updateData.category =
        data.categoryId === null
          ? { disconnect: true }
          : { connect: { nodeId: data.categoryId } };
    }
    if (data.typeId !== undefined) {
      updateData.type = { connect: { nodeId: data.typeId } };
    }
    if (data.basePrice !== undefined) {
      updateData.basePrice =
        data.basePrice === null ? null : new Prisma.Decimal(data.basePrice);
    }
    if (data.unit !== undefined) {
      updateData.unit = data.unit;
    }
    if (data.specimen !== undefined) {
      updateData.specimen = data.specimen;
    }
    if (data.prepNote !== undefined) {
      updateData.prepNote = data.prepNote;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const updated =
      await this.serviceItemRepository.updateServiceItemWithConfig(
        itemId,
        updateData,
        data.configs,
      );

    return this.mapToResponseDto(updated);
  }

  private mapToResponseDto(item: any): ServiceItemResponseDto {
    return {
      itemId: item.itemId,
      itemCode: item.itemCode,
      name: item.name,
      unit: item.unit,
      specimen: item.specimen,
      prepNote: item.prepNote,
      isActive: item.isActive,
      categoryName: item.category?.name || null,
      typeName: item.type?.name || null,
      basePrice: item.basePrice || 0,
      configs: item.configs,
    };
  }

  public async updateStatus(itemId: string, isActive: boolean) {
    const item = await this.serviceItemRepository.findById(itemId);

    if (!item) {
      throw new BaseError(404, "Không tìm thấy dịch vụ");
    }

    const updated = await this.serviceItemRepository.updateStatus(
      itemId,
      isActive,
    );

    return this.mapToResponseDto(updated);
  }

  public async deleteServiceItem(id: string): Promise<void> {
    const existing = await this.serviceItemRepository.findById(id);
    if (!existing) throw new BaseError(404, "Không tìm thấy dịch vụ CLS");

    await prisma.$transaction(async (tx) => {
      await this.serviceTemplateDetailRepository.deleteByServiceItemId(id, tx);
      await this.serviceItemRepository.deleteServiceItem(id);
    });
  }
}
