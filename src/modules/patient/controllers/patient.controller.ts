import { PatientService } from "../services/patient.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientEnumResponseDto } from "../dtos/patient-enum.response.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class PatientController {
  private patientService = new PatientService();

  public createPatient = async (
    req: AuthenticatedRequest<{}, any, CreatePatientRequestDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId;
    if (!clinicId) {
      return successResponse(res, 401, null, "Clinic ID not found in token");
    }
    let result: PatientResponseDto = await this.patientService.createPatient(req.body, clinicId);
    return successResponse(res, 201, result, "Tạo bệnh nhân thành công");
  };

  public getPatientById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId;
    if (!clinicId) {
      return successResponse(res, 401, null, "Clinic ID not found in token");
    }
    let result: PatientResponseDto | null = await this.patientService.getPatientById(id, clinicId);
    if (!result) {
      return successResponse(res, 404, null, "Không tìm thấy bệnh nhân");
    }
    return successResponse(res, 200, result, "Lấy thông tin bệnh nhân thành công");
  };

  public getPatients = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string | undefined;
    const clinicId = req.payload?.clinicId;
    if (!clinicId) {
      return successResponse(res, 401, null, "Clinic ID not found in token");
    }

    let result: PatientListResponseDto = await this.patientService.getPatients(page, size, search, clinicId);
    return successResponse(res, 200, result.patients, "Lấy danh sách bệnh nhân thành công", result.pagination);
  };

  public updatePatient = async (
    req: AuthenticatedRequest<{ id: string }, {}, UpdatePatientRequestDto>,
    res: Response
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId;
    if (!clinicId) {
      return successResponse(res, 401, null, "Clinic ID not found in token");
    }
    let result: PatientResponseDto = await this.patientService.updatePatient(id, req.body, clinicId);
    return successResponse(res, 200, result, "Cập nhật thông tin bệnh nhân thành công");
  };

  public getPatientEnums = async (
    req: Request,
    res: Response
  ) => {
    let result: PatientEnumResponseDto = await this.patientService.getPatientEnums();
    return successResponse(res, 200, result, "Lấy danh sách enum thành công");
  };

}
