import { Request, Response } from "express";
import { NodeType } from "@prisma/client";
import { ServiceNodeService } from "../services/service-node.service";
import { successResponse } from "../../../utils/response.util";
import {
  CreateServiceNodeRequestDto,
  UpdateServiceNodeRequestDto,
} from "../dtos/service-node.request.dto";
import { BaseError } from "../../../utils/base-error.util";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class ServiceNodeController {
  private service = new ServiceNodeService();

  public create = async (req: Request, res: Response) => {
    const dto = req.body as CreateServiceNodeRequestDto;
    const node = await this.service.create(dto);
    return successResponse(res, 201, node, "Tạo dịch vụ CLS thành công");
  };

  public update = async (req: Request<{ nodeId: string }>, res: Response) => {
    const dto = req.body as UpdateServiceNodeRequestDto;
    const node = await this.service.update(req.params.nodeId, dto);
    return successResponse(res, 200, node, "Cập nhật dịch vụ CLS thành công");
  };

  public list = async (req: Request, res: Response) => {
    const nodeTypeRaw = req.query.nodeType as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
      isActiveParam === undefined ? undefined : isActiveParam === "true";
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const size = Math.max(parseInt(req.query.size as string, 10) || 10, 1);
    const search = req.query.search as string | undefined;

    let nodeType: NodeType | undefined;
    if (nodeTypeRaw) {
      if (!Object.values(NodeType).includes(nodeTypeRaw as NodeType)) {
        throw new BaseError(400, "NodeType không hợp lệ");
      }
      nodeType = nodeTypeRaw as NodeType;
    }
    const { nodes, pagination } = await this.service.list(
      page,
      size,
      nodeType,
      isActive,
      search,
    );
    return successResponse(
      res,
      200,
      nodes,
      "Lấy danh sách thành công",
      pagination,
    );
  };

  public getNodeTypes = async (_req: Request, res: Response) => {
    const types = this.service.getNodeTypes();
    return successResponse(
      res,
      200,
      types,
      "Lấy danh sách Danh mục/Loại CLS thành công",
    );
  };

  public listTypesByCategory = async (
    req: Request<{ categoryId: string }>,
    res: Response,
  ) => {
    const categoryId = req.params.categoryId;
    const nodes = await this.service.listTypesByCategory(categoryId);
    return successResponse(
      res,
      200,
      nodes,
      "Lấy danh sách loại dịch vụ thành công theo danh mục thành công",
    );
  };

  public deleteNode = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    await this.service.deleteNode(id);
    return successResponse(res, 200, null, "Xoá loại dịch vụ thành công");
  };
}



