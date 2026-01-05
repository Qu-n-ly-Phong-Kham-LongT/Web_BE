import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../utils/response.util";
import { ClinicService } from "../services/clinic.service";
import { ClinicListResponseDto, ClinicResponseDto } from "../dtos/clinic.response.dto";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicRequestDto } from "../dtos/clinic.request.dto";

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

  public createClinic = async (
    req: Request<{}, {}, ClinicRequestDto>,
    res: Response
  ) => {
    const newClinic = await this.clinicService.createClinic(req.body);
    return successResponse(res, 201, newClinic, "Tạo phòng khám mới thành công.");
  };

  public getClinics = async (
    req: Request,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;

    const result: ClinicListResponseDto = await this.clinicService.getClinics(page, size, search);
    return successResponse(res, 200, result.clinics, "Lay danh sach phong kham thanh cong", result.pagination);
  };

  public updateClinic = async (
    req: Request<{ id: string }, {}, ClinicRequestDto>,
    res: Response
  ) => {
    const clinicId = req.params.id;
    const updateData = req.body;
    const updatedClinic = await this.clinicService.updateClinic(clinicId, updateData);
    return successResponse(res, 200, updatedClinic, "Cập nhật thông tin phòng khám thành công.");
  }
}
