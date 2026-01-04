import { PatientService } from "../services/patient.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientEnumResponseDto } from "../dtos/patient-enum.response.dto";
// import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { IJwtPayload } from "../../../utils/jwt.util";

interface AuthenticatedRequest<ReqBody = any> extends Request<{}, any, ReqBody> {
  payload?: IJwtPayload;
}
export class PatientController {
  private patientService = new PatientService();

  public createPatient = async (
    req: AuthenticatedRequest<CreatePatientRequestDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId;
    if (!clinicId) {
      return successResponse(res, 401, null, "Clinic ID not found in token");
    }
    let result: PatientResponseDto = await this.patientService.createPatient(req.body, clinicId);
    return successResponse(res, 201, result, "Create patient successfully");
  };

  public getPatientById = async (
    req: Request,
    res: Response
  ) => {
    const { id } = req.params;
    let result: PatientResponseDto | null = await this.patientService.getPatientById(id);
    if (!result) {
      return successResponse(res, 404, null, "Patient not found");
    }
    return successResponse(res, 200, result, "Patient information retrieved successfully");
  };

  public getPatients = async (
    req: Request,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string | undefined;

    let result: PatientListResponseDto = await this.patientService.getPatients(page, size, search);
    return successResponse(res, 200, result.patients, "Patient list retrieved successfully", result.pagination);
  };

  public updatePatient = async (
    req: Request<{ id: string }, {}, UpdatePatientRequestDto>,
    res: Response
  ) => {
    const { id } = req.params;
    let result: PatientResponseDto = await this.patientService.updatePatient(id, req.body);
    return successResponse(res, 200, result, "Patient information updated successfully");
  };

  public getPatientEnums = async (
    req: Request,
    res: Response
  ) => {
    let result: PatientEnumResponseDto = await this.patientService.getPatientEnums();
    return successResponse(res, 200, result, "Patient enums retrieved successfully");
  };

}
