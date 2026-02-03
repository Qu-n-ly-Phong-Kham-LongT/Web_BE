import { ServiceTemplateService } from "../services/service-template.service";
import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreateServiceTemplateRequestDto } from "../dtos/create-service-template.request.dto";
import { UpdateServiceTemplateRequestDto } from "../dtos/update-service-template.request.dto";
import { ServiceTemplateResponseDto } from "../dtos/service-template.response.dto";
import { ServiceTemplateListResponseDto } from "../dtos/service-template-list.response.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class ServiceTemplateController {
  private serviceTemplateService = new ServiceTemplateService();

  public createServiceTemplate = async (
    req: AuthenticatedRequest<{}, {}, CreateServiceTemplateRequestDto>,
    res: Response
  ) => {
    let result: ServiceTemplateResponseDto = await this.serviceTemplateService.createServiceTemplate(
      req.body
    );
    return successResponse(res, 201, result, "Tạo mẫu dịch vụ thành công");
  };

  public getServiceTemplateById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;
    let result: ServiceTemplateResponseDto = await this.serviceTemplateService.getServiceTemplateById(id);
    return successResponse(res, 200, result, "Lấy thông tin mẫu dịch vụ thành công");
  };

  public getServiceTemplates = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
      isActiveParam === undefined ? undefined : isActiveParam === "true";
    const sort =
      (req.query.sort as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    let result: ServiceTemplateListResponseDto = await this.serviceTemplateService.getServiceTemplates(
      page,
      size,
      search,
      isActive,
      sort
    );
    return successResponse(res, 200, result.templates, "Lấy danh sách mẫu dịch vụ thành công", result.pagination);
  };

  public getServiceTemplatesForDoctor = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
      isActiveParam === undefined ? undefined : isActiveParam === "true";
    const sort =
      (req.query.sort as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    let result: ServiceTemplateListResponseDto =
      await this.serviceTemplateService.getServiceTemplatesForDoctor(
        page,
        size,
        search,
        isActive,
        sort
      );
    return successResponse(
      res,
      200,
      result.templates,
      "Lấy danh sách mẫu chỉ định dịch vụ cho bác sĩ thành công",
      result.pagination
    );
  };

  public updateServiceTemplate = async (
    req: AuthenticatedRequest<{ id: string }, {}, UpdateServiceTemplateRequestDto>,
    res: Response
  ) => {
    const { id } = req.params;
    let result: ServiceTemplateResponseDto = await this.serviceTemplateService.updateServiceTemplate(
      id,
      req.body
    );
    return successResponse(res, 200, result, "Cập nhật mẫu dịch vụ thành công");
  };
}

