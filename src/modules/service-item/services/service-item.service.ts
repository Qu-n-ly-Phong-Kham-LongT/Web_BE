import { ServiceItem } from "@prisma/client";
import { ServiceNodeRepository } from "../../service-node/repositories/service-node.repository";
import { CreateServiceItemRequestDto } from "../dtos/service-item.request.dto";
import { ServiceItemRepository } from "../repositories/service-item.request.repository";
import { BaseError } from "../../../utils/base-error.util";

export class ServiceItemService {
  private serviceNodeRepository = new ServiceNodeRepository();
  private serviceItemRepository = new ServiceItemRepository();

  public async createItem(createData: CreateServiceItemRequestDto) {
    const existingItem = await this.serviceItemRepository.findByCode(
      createData.itemCode
    );
    if (existingItem) {
      throw new BaseError(409, "Dịch vụ này đã tồn tại");
    }

    const typeNode = await this.serviceNodeRepository.findNodeById(createData.typeId)
    if (!typeNode) {
        throw new BaseError(409, "Loại dịch vụ này không tồn tại")
    }

    if (createData.categoryId) {
        const categoryNode = await this.serviceNodeRepository.findNodeById(createData.categoryId)
        if (!categoryNode) {
            throw new BaseError(409, "Danh mục dịch vụ này không tồn tại")
        }
    }

    return await this.serviceItemRepository.createServiceItemWithConfig(createData)
  }
}
