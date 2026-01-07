import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import {
  BasicMedicalRecordCreateBodyDto,
  BasicMedicalRecordRequestDto,
} from "../dtos/medical-record.request.dto";
import { MedicalRecordService } from "../services/medical-record.service";

export class MedicalRecordController {
  private medicalRecordService = new MedicalRecordService();

  public createMedicalRecord = async (
    req: AuthenticatedRequest<{}, {}, BasicMedicalRecordCreateBodyDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId;
    const doctorId = req.payload?.userId;

    const data: BasicMedicalRecordRequestDto = {
      patientId: req.body.patientId,
      doctorId: doctorId,
      clinicId: clinicId,
      consultationFee: req.body.consultationFee,
    };

    const result = await this.medicalRecordService.createBasicMedicalRecord(data);
    return successResponse(res, 201, result, "Tạo bệnh án và khởi tạo khám lâm sàng thành công");
  };
}
