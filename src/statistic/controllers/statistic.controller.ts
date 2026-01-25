import { Response } from "express";
import { successResponse } from "../../utils/response.util";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { StatisticService } from "../services/statistic.service";

export class StatisticController {
  private statisticService = new StatisticService();

  public getDashboard = async (
    req: AuthenticatedRequest<
      {},
      {},
      {},
      { range?: string; points?: string; limit?: string }
    >,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const range = (req.query.range as "day" | "week" | "month") ?? "day";
    const points = req.query.points ? Number(req.query.points) : 6;
    const limit = req.query.limit ? Number(req.query.limit) : 5;

    const result = await this.statisticService.getDashboard(
      range,
      points,
      limit,
      clinicId,
    );
    return successResponse(res, 200, result, "Lay dashboard thanh cong");
  };

  public getRangeTypes = async (_req: AuthenticatedRequest, res: Response) => {
    const result = this.statisticService.getRangeTypes();
    return successResponse(
      res,
      200,
      result,
      "Lấy loại khoảng thời gian thành công",
    );
  };
}
