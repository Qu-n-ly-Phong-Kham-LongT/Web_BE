import { ServiceNodeRepository } from "../../service-node/repositories/service-node.repository";
import { CreateServiceItemRequestDto } from "../dtos/service-item.request.dto";
import { ServiceItemRepository } from "../repositories/service-item.request.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ServiceItemResponseDto } from "../dtos/service-item.response.dto";
import { createPagination } from "../../../utils/pagination.util";

export class ServiceItemService {
  private serviceNodeRepository = new ServiceNodeRepository();
  private serviceItemRepository = new ServiceItemRepository();

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
    typeId?: string
  ) {
    const skip = (page - 1) * size;

    const { items, total } = await this.serviceItemRepository.findAll({
      skip,
      take: size,
      search,
      typeId,
    });

    const pagination = createPagination(page, size, total);

    return {
      data: items.map((item) => this.mapToResponseDto(item)),
      pagination,
    };
  }

  public async createItem(createData: CreateServiceItemRequestDto) {
    const existingItem = await this.serviceItemRepository.findByCode(
      createData.itemCode
    );
    if (existingItem) {
      throw new BaseError(409, "Dịch vụ này đã tồn tại");
    }

    const typeNode = await this.serviceNodeRepository.findNodeById(
      createData.typeId
    );
    if (!typeNode) {
      throw new BaseError(409, "Loại dịch vụ này không tồn tại");
    }

    if (createData.categoryId) {
      const categoryNode = await this.serviceNodeRepository.findNodeById(
        createData.categoryId
      );
      if (!categoryNode) {
        throw new BaseError(409, "Danh mục dịch vụ này không tồn tại");
      }
    }

    return await this.serviceItemRepository.createServiceItemWithConfig(
      createData
    );
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
}
