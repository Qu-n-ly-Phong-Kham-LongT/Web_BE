import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { PrintJobService } from "../services/print-job.service";

export class PrintJobController {
  private printJobService = new PrintJobService();

  public getJobStatus = async (
    req: AuthenticatedRequest<{ jobId: string }>,
    res: Response,
  ) => {
    const result = await this.printJobService.getJobStatus(
      req.params.jobId,
      req.payload?.clinicId,
    );
    return successResponse(res, 200, result, "Print job status");
  };
}
