import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { GetFollowUpsQueryDto } from "../dtos/follow-up.request.dto";
import { FollowUpService } from "../services/follow-up.service";

export class FollowUpController {
  private followUpService = new FollowUpService();

  public getFollowUps = async (
    req: AuthenticatedRequest<{}, {}, {}, Record<string, unknown>>,
    res: Response,
  ) => {
    const query = req.query as unknown as GetFollowUpsQueryDto;

    const result = await this.followUpService.getFollowUps(
      req.payload?.clinicId,
      query,
    );

    return successResponse(
      res,
      200,
      result.items,
      "Lấy danh sách tái khám thành công",
      result.pagination,
    );
  };
}