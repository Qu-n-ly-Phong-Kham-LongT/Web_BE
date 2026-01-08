import { PatientService } from "../services/patient.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreatePatientRequestDto } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestDto } from "../dtos/update-patient.request.dto";
import { PatientResponseDto } from "../dtos/patient.response.dto";
import { PatientListResponseDto } from "../dtos/patient-list.response.dto";
import { PatientEnumResponseDto } from "../dtos/patient-enum.response.dto";
import { PatientRelativeResponseDto } from "../dtos/patient-relative.response.dto";
import { UpdatePatientRelativeRequestDto } from "../dtos/update-patient-relative.request.dto";
import { PatientAllergyResponseDto } from "../dtos/patient-allergy.response.dto";
import { CreatePatientAllergyRequestDto } from "../dtos/create-patient-allergy.request.dto";
import { UpdatePatientAllergyRequestDto } from "../dtos/update-patient-allergy.request.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class PatientController {
  private patientService = new PatientService();

  public createPatient = async (
    req: AuthenticatedRequest<{}, any, CreatePatientRequestDto>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    let result: PatientResponseDto = await this.patientService.createPatient(req.body, clinicId);
    return successResponse(res, 201, result, "Tạo bệnh nhân thành công");
  };

  public getPatientById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    let result: PatientResponseDto = await this.patientService.getPatientById(id, clinicId);
    return successResponse(res, 200, result, "Lấy thông tin bệnh nhân thành công");
  };

  public getPatients = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const clinicId = req.payload?.clinicId ?? undefined;

    let result: PatientListResponseDto = await this.patientService.getPatients(page, size, search, clinicId);
    return successResponse(res, 200, result.patients, "Lấy danh sách bệnh nhân thành công", result.pagination);
  };
  public getDailyQueue = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const clinicId = req.payload?.clinicId ?? undefined;

    const { queue, pagination } = await this.patientService.getDailyQueue(
      clinicId,
      page,
      size,
      search
    );
    return successResponse(res, 200, queue, "Lấy danh sách hàng đợi thành công", pagination);
  };

  public updatePatient = async (
    req: AuthenticatedRequest<{ id: string }, {}, UpdatePatientRequestDto>,
    res: Response
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
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

  public getRelativeById = async (
    req: AuthenticatedRequest<{ relativeId: string }>,
    res: Response
  ) => {
    const { relativeId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientRelativeResponseDto = await this.patientService.getRelativeById(relativeId, clinicId);
    return successResponse(res, 200, result, "Lấy thông tin người thân thành công");
  };

  public getRelativesByPatientId = async (
    req: AuthenticatedRequest<{ patientId: string }>,
    res: Response
  ) => {
    const { patientId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientRelativeResponseDto[] = await this.patientService.getRelativesByPatientId(patientId, clinicId);
    return successResponse(res, 200, result, "Lấy danh sách người thân thành công");
  };

  public updateRelative = async (
    req: AuthenticatedRequest<{ relativeId: string }, {}, UpdatePatientRelativeRequestDto>,
    res: Response
  ) => {
    const { relativeId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientRelativeResponseDto = await this.patientService.updateRelative(relativeId, req.body, clinicId);
    return successResponse(res, 200, result, "Cập nhật thông tin người thân thành công");
  };

  public createAllergies = async (
    req: AuthenticatedRequest<{ patientId: string }, {}, CreatePatientAllergyRequestDto>,
    res: Response
  ) => {
    const { patientId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientAllergyResponseDto[] = await this.patientService.createAllergies(patientId, req.body, clinicId);
    return successResponse(res, 201, result, "Tạo thông tin dị ứng thành công");
  };

  public getAllergyById = async (
    req: AuthenticatedRequest<{ allergyId: string }>,
    res: Response
  ) => {
    const { allergyId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientAllergyResponseDto = await this.patientService.getAllergyById(allergyId, clinicId);
    return successResponse(res, 200, result, "Lấy thông tin dị ứng thành công");
  };

  public getAllergiesByPatientId = async (
    req: AuthenticatedRequest<{ patientId: string }>,
    res: Response
  ) => {
    const { patientId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientAllergyResponseDto[] = await this.patientService.getAllergiesByPatientId(patientId, clinicId);
    return successResponse(res, 200, result, "Lấy danh sách dị ứng thành công");
  };

  public updateAllergy = async (
    req: AuthenticatedRequest<{ allergyId: string }, {}, UpdatePatientAllergyRequestDto>,
    res: Response
  ) => {
    const { allergyId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    const result: PatientAllergyResponseDto = await this.patientService.updateAllergy(allergyId, req.body, clinicId);
    return successResponse(res, 200, result, "Cập nhật thông tin dị ứng thành công");
  };

  public deleteAllergy = async (
    req: AuthenticatedRequest<{ allergyId: string }>,
    res: Response
  ) => {
    const { allergyId } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    await this.patientService.deleteAllergy(allergyId, clinicId);
    return successResponse(res, 200, null, "Xóa thông tin dị ứng thành công");
  };

}
