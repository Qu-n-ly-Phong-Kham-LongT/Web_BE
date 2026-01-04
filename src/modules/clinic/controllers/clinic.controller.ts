import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../utils/response.util";
import { ClinicService } from "../services/clinic.service";
import { ClinicResponseDto } from "../dtos/clinic.response.dto";
import { BaseError } from "../../../utils/base-error.util";

export class ClinicController {
  private clinicService = new ClinicService();

  public getClinicById = async (
    req: Request<{ id: string }>,
    res: Response<ClinicResponseDto>,
    next: NextFunction
  ) => {
    try {
      const clinic = await this.clinicService.getClinicById(req.params.id);
      return successResponse(res, 200, clinic, "Lấy thông tin phòng khám thành công");
    } catch (err) {
      if (err instanceof BaseError && err.statusCode === 404) {
        return successResponse(res, 404, null, err.message);
      }
      next(err);
    }
  };
}
