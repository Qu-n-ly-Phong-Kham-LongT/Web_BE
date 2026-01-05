import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import {
  BasicMedicalRecordCreateBodyDto,
  BasicMedicalRecordRequestDto,
} from "../dtos/medical-record.request.dto";
import { MedicalRecordService } from "../services/medical-record.service";
import { BaseError } from "../../../utils/base-error.util";

export class MedicalRecordController {
  private medicalRecordService = new MedicalRecordService();

  public createMedicalRecord = async (
    req: AuthenticatedRequest<{}, {}, BasicMedicalRecordCreateBodyDto>,
    res: Response
  ) => {
    const { payload } = req;
    if (!payload?.userId || !payload.clinicId) {
      throw new BaseError(401, "Thiếu thông tin bác sĩ hoặc phòng khám trong token");
    }

    const data: BasicMedicalRecordRequestDto = {
      patientId: req.body.patientId,
      doctorId: payload.userId,
      clinicId: payload.clinicId,
      consultationFee: req.body.consultationFee,
    };

    const result = await this.medicalRecordService.createBasicMedicalRecord(data);
    return successResponse(res, 201, result, "Tạo bệnh án và khởi tạo khám lâm sàng thành công");
  };
}
