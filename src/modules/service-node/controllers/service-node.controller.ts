import { Request, Response } from "express";
import { NodeType } from "@prisma/client";
import { ServiceNodeService } from "../services/service-node.service";
import { successResponse } from "../../../utils/response.util";
import {
  CreateServiceNodeRequestDto,
  UpdateServiceNodeRequestDto,
} from "../dtos/service-node.request.dto";
import { BaseError } from "../../../utils/base-error.util";

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
    const sortBy = req.query.sortBy as string | undefined;
    const sortDir = req.query.sortDir as string | undefined;

    let nodeType: NodeType | undefined;
    if (nodeTypeRaw) {
      if (!Object.values(NodeType).includes(nodeTypeRaw as NodeType)) {
        throw new BaseError(400, "NodeType không hợp lệ");
      }
      nodeType = nodeTypeRaw as NodeType;
    }
    const { nodes, pagination } = await this.service.list(
      nodeType,
      isActive,
      page,
      size,
      search,
      sortBy,
      sortDir
    );
    return successResponse(
      res,
      200,
      nodes,
      "Lấy danh sách thành công",
      pagination
    );
  };

  public getNodeTypes = async (_req: Request, res: Response) => {
    const types = this.service.getNodeTypes();
    return successResponse(res, 200, types, "Lấy danh sách Danh mục/Loại CLS thành công");
  };
}
