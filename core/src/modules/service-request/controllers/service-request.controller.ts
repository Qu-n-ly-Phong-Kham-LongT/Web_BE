import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import {
  BasicServiceRequestWithDateDto,
  CreateServiceRequestDto,
} from "../dtos/service-request.request.dto";
import { ServiceRequestService } from "../services/service-request.service";

export class ServiceRequestController {
  private serviceRequestService = new ServiceRequestService();

  public initRequest = async (
    req: AuthenticatedRequest<{}, {}, { recordId: string }>,
    res: Response,
  ) => {
    const { recordId } = req.body;
    const doctorId = req.payload?.userId;

    const result = await this.serviceRequestService.initializeNewRequest(
      recordId,
      doctorId!,
    );

    return successResponse(res, 200, result, "Tạo phiếu chỉ định thành công.");
  };

  public saveRequest = async (
    req: AuthenticatedRequest<
      { requestId: string },
      {},
      CreateServiceRequestDto
    >,
    res: Response,
  ) => {
    const { requestId } = req.params;

    const result = await this.serviceRequestService.saveServiceRequest(
      requestId,
      req.body,
    );
    return successResponse(
      res,
      200,
      result,
      "Cập nhật phiếu chỉ định thành công",
    );
  };

  public create = async (
    req: AuthenticatedRequest<{}, any, CreateServiceRequestDto>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const created = await this.serviceRequestService.createServiceRequest(
      {
        ...req.body,
        orderingDoctorId: req.payload?.userId ?? "",
      },
      clinicId ?? undefined,
    );
    return successResponse(
      res,
      201,
      created,
      "Tạo chỉ định cận lâm sàng thành công",
    );
  };

  public getById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const result = await this.serviceRequestService.getRequestById(
      req.params.id,
      clinicId,
    );
    return successResponse(res, 200, result, "Lấy chi tiết phiếu chỉ định");
  };

  public printServiceRequestPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const result = await this.serviceRequestService.printOrGet(
      req.params.id,
      clinicId,
      req.payload?.userId ?? undefined,
    );

    const statusCode = result.enqueued ? 202 : 200;
    const messages = result.enqueued
      ? "Đã thêm phiếu in vào hàng đợi"
      : "Lấy file phiếu chỉ định thành công";
    return successResponse(res, statusCode, result, messages);
  };

  public createRawRequestWithDate = async (
    req: AuthenticatedRequest<{}, {}, BasicServiceRequestWithDateDto>,
    res: Response,
  ) => {
    const doctorId =
      req.body.orderingDoctorId || req.payload?.userId || "";
    const result = await this.serviceRequestService.createRequestWithDate(
      req.body.recordId,
      doctorId,
      req.body.createdAt,
      req.body.updatedAt,
    );

    return successResponse(
      res,
      200,
      result,
      "Khởi tạo phiếu chỉ định thành công",
    );
  };
}
