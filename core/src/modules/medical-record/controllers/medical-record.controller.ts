import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import {
  BasicMedicalRecordCreateBodyDto,
  BasicMedicalRecordRequestDto,
} from "../dtos/medical-record.request.dto";
import { MedicalRecordService } from "../services/medical-record.service";
import { LegacyMedicalRecordImportRequestDto } from "../dtos/legacy-medical-record.request.dto";

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

  public getMedicalRecordsByPatientId = async (
    req: AuthenticatedRequest<{ patientId: string }, {}, {}, { fromDate?: string; toDate?: string }>,
    res: Response
  ) => {
    const { patientId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    
    // Parse dates từ query params
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    if (req.query.fromDate) {
      fromDate = new Date(req.query.fromDate as string);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: "Ngày bắt đầu không hợp lệ" });
      }
    }
    
    if (req.query.toDate) {
      toDate = new Date(req.query.toDate as string);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Ngày kết thúc không hợp lệ" });
      }
    }

    const records = await this.medicalRecordService.getMedicalRecordsByPatientId(
      patientId,
      clinicId,
      fromDate,
      toDate
    );

    return successResponse(
      res,
      200,
      records,
      "Lấy danh sách bệnh án thành công"
    );
  };
  public importLegacyMedicalRecord = async (
    req: AuthenticatedRequest<{}, {}, LegacyMedicalRecordImportRequestDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId;
    const doctorId = req.payload?.userId;
    if (!clinicId || !doctorId) {
      return res.status(403).json({ message: "Khong co quyen thuc hien" });
    }

    const result = await this.medicalRecordService.importLegacyMedicalRecord(
      req.body,
      doctorId,
      clinicId
    );

    return successResponse(
      res,
      201,
      result,
      "Nhap benh an cu thanh cong"
    );
  };
}


