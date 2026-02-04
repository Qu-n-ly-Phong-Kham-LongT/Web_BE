import { PrescriptionTemplateService } from "../services/prescription-template.service";
import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreatePrescriptionTemplateRequestDto } from "../dtos/create-prescription-template.request.dto";
import { UpdatePrescriptionTemplateRequestDto } from "../dtos/update-prescription-template.request.dto";
import { PrescriptionTemplateResponseDto } from "../dtos/prescription-template.response.dto";
import { PrescriptionTemplateListResponseDto } from "../dtos/prescription-template-list.response.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class PrescriptionTemplateController {
  private prescriptionTemplateService = new PrescriptionTemplateService();

  public createPrescriptionTemplate = async (
    req: AuthenticatedRequest<{}, any, CreatePrescriptionTemplateRequestDto>,
    res: Response,
  ) => {
    const userId = req.payload?.userId;
    let result: PrescriptionTemplateResponseDto =
      await this.prescriptionTemplateService.createPrescriptionTemplate(
        req.body,
        userId,
      );
    return successResponse(res, 201, result, "Tạo mẫu đơn thuốc thành công");
  };

  public getPrescriptionTemplateById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    let result: PrescriptionTemplateResponseDto =
      await this.prescriptionTemplateService.getPrescriptionTemplateById(id);
    return successResponse(
      res,
      200,
      result,
      "Lấy thông tin mẫu đơn thuốc thành công",
    );
  };

  public getPrescriptionTemplates = async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;

    let result: PrescriptionTemplateListResponseDto =
      await this.prescriptionTemplateService.getPrescriptionTemplates(
        page,
        size,
        search,
      );
    return successResponse(
      res,
      200,
      result.templates,
      "Lấy danh sách mẫu đơn thuốc thành công",
      result.pagination,
    );
  };

  public updatePrescriptionTemplate = async (
    req: AuthenticatedRequest<
      { id: string },
      {},
      UpdatePrescriptionTemplateRequestDto
    >,
    res: Response,
  ) => {
    const { id } = req.params;
    let result: PrescriptionTemplateResponseDto =
      await this.prescriptionTemplateService.updatePrescriptionTemplate(
        id,
        req.body,
      );
    return successResponse(
      res,
      200,
      result,
      "Cập nhật mẫu đơn thuốc thành công",
    );
  };

  public deletePrescriptionTemplate = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    await this.prescriptionTemplateService.deletePrecriptionTemplate(id);
    return successResponse(res, 200, null, "Xoá mẫu toa thuốc thành công");
  };
}
