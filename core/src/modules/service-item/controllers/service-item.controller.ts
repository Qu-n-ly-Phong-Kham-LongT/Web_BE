import {
  CreateServiceItemRequestDto,
  UpdateServiceItemRequestDto,
  UpdateServiceItemStatusDto,
} from "../dtos/service-item.request.dto";
import { ServiceItemService } from "../services/service-item.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { ServiceItemResponseDto } from "../dtos/service-item.response.dto";
import { InputType } from "@prisma/client";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class ServiceItemController {
  private service = new ServiceItemService();

  public create = async (
    req: Request<{}, {}, CreateServiceItemRequestDto>,
    res: Response,
  ) => {
    const data = req.body;
    const newItem = await this.service.createItem(data);
    return successResponse(res, 201, newItem, "Tạo dịch vụ CLS thành công");
  };

  public getById = async (
    req: Request<{ id: string }>,
    res: Response<ServiceItemResponseDto>,
  ) => {
    const result = await this.service.getItemById(req.params.id);
    return successResponse(res, 200, result, "Lấy danh sách CLS thành công");
  };

  public getAll = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string;
    const typeId = req.query.typeId as string;
    const categoryId = req.query.categoryId as string;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
      isActiveParam === undefined ? undefined : isActiveParam === "true";
    const result = await this.service.getAllItems(
      page,
      size,
      search,
      typeId,
      categoryId,
      isActive,
    );

    return successResponse(
      res,
      200,
      result,
      "Lấy danh sách dịch vụ cận lâm sàng thành công",
    );
  };

  public getAllInputTypes = async (_req: Request, res: Response) => {
    const inputTypes = Object.values(InputType);
    return successResponse(
      res,
      200,
      inputTypes,
      "Lấy danh sách loại dữ liệu nhập thành công",
    );
  };

  public update = async (
    req: Request<{ id: string }, {}, UpdateServiceItemRequestDto>,
    res: Response,
  ) => {
    const result = await this.service.updateItem(req.params.id, req.body);
    return successResponse(res, 200, result, "Cập nhật thành công");
  };

  public udpateStatus = async (
    req: Request<{ id: string }, {}, UpdateServiceItemStatusDto>,
    res: Response,
  ) => {
    const result = await this.service.updateStatus(
      req.params.id,
      req.body.isActive,
    );
    return successResponse(res, 200, result, "Cập nhật thành công");
  };

  public deleteServiceItem = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    await this.service.deleteServiceItem(id);
    return successResponse(res, 200, null, "Xoá dịch vụ CLS thành công");
  };
}
