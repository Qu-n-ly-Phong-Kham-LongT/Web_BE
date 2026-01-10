import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { ServiceResultService } from "../services/service-result.service";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { CreateServiceResultBulkRequestDto } from "../dtos/service-result.request.dto";

export class ServiceResultController {
  private serviceResultService = new ServiceResultService();

  public createServiceResultsBulk = async (
    req: AuthenticatedRequest<{}, {}, CreateServiceResultBulkRequestDto>,
    res: Response
  ) => {
    const created = await this.serviceResultService.createServiceResultsBulk(req.body);
    return successResponse(res, 201, created, "Tạo kết quả cận lâm sàng thành công");
  };

  public upsertServiceResultsBulk = async (
    req: AuthenticatedRequest<{}, {}, CreateServiceResultBulkRequestDto>,
    res: Response
  ) => {
    const updated = await this.serviceResultService.upsertServiceResultsBulk(req.body);
    return successResponse(res, 200, updated, "Cập nhật kết quả cận lâm sàng thành công");
  };
}
