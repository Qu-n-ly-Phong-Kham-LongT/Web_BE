import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { SharedService } from "../services/shared.service";

export class SharedController {
  private sharedService = new SharedService();

  public getFullMedicalRecord = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.sharedService.getFullMedicalRecord(
      req.params.id,
      clinicId,
    );
    return successResponse(
      res,
      200,
      result,
      "Lấy bệnh án bệnh nhân thành công",
    );
  };
  public printMedicalRecordPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.sharedService.enqueueMedicalRecordPrint(
      req.params.id,
      clinicId,
      req.payload?.userId,
    );
    return successResponse(
      res,
      202,
      result,
      "Đã thêm vào hàng đợi in bệnh án thành công",
    );
  };

  public getOrPrintMedicalRecordPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.sharedService.getMedicalRecordFile(
      req.params.id,
      clinicId,
    );
    const statusCode = result.enqueued ? 202 : 200;
    const message = result.enqueued
      ? "Đã thêm file in vào hàng đợi"
      : "Lấy file bệnh án thành công";
    return successResponse(res, statusCode, result, message);
  };
}
