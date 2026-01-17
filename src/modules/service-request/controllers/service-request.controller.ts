import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { CreateServiceRequestDto } from "../dtos/service-request.request.dto";
import { ServiceRequestService } from "../services/service-request.service";

export class ServiceRequestController {
  private serviceRequestService = new ServiceRequestService();

  public create = async (
    req: AuthenticatedRequest<{}, any, CreateServiceRequestDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const created = await this.serviceRequestService.createServiceRequest(
      {
        ...req.body,
        orderingDoctorId: req.payload?.userId ?? "",
      },
      clinicId ?? undefined
    );
    return successResponse(res, 201, created, "Tạo chỉ định cận lâm sàng thành công");
  };

  public getById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const result = await this.serviceRequestService.getRequestById(
      req.params.id,
      clinicId
    );
    return successResponse(res, 200, result, "Lấy chi tiết phiếu chỉ định");
  };

  public printServiceRequestPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.serviceRequestService.printServiceRequestPdf(
      req.params.id,
      clinicId
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.requestCode}.pdf"`,
    );

    return res.send(result.buffer);
  };
}


