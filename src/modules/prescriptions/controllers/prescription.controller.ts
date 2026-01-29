import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { UpsertDianosisPrescriptionDto } from "../dtos/prescription.request.dto";
import { PrecriptionService } from "../services/prescription.service";
import { PrescriptionStatus } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";

export class PrescriptionController {
  private prescriptionService = new PrecriptionService();

  public upsertPrescriptionDiagnosis = async (
    req: AuthenticatedRequest<{}, any, UpsertDianosisPrescriptionDto>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.prescriptionService.upsertPrecriptionDiagnosis(
      req.body,
      clinicId,
    );
    return successResponse(
      res,
      200,
      result,
      "Tạo/Cập nhật toa thuốc và chẩn đoán thành công",
    );
  };

  public printPrescriptionPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const { id } = req.params;

    const result = await this.prescriptionService.enqueuePrescriptionPrint(
      id,
      clinicId,
      req.payload?.userId,
    );
    return successResponse(
      res,
      202,
      result,
      "Đã thêm vào hàng đợi in toa thuốc thành công",
    );
  };

  public getPrescriptionStatus = async (
    _req: AuthenticatedRequest,
    res: Response,
  ) => {
    const result = await this.prescriptionService.getPrescriptionStatus();
    return successResponse(
      res,
      200,
      result,
      "Lấy danh sách trạng thái enum của toa thuốc thành công",
    );
  };
  public updateStatusToDraft = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const { id } = req.params;
    const result = await this.prescriptionService.updateStatusToDraft(
      id,
      clinicId,
    );
    return successResponse(
      res,
      200,
      result,
      "Cập nhật trạng thái toa thuốc về nháp thành công",
    );
  };

  public getPrescriptionsByPatientId = async (
    req: AuthenticatedRequest<
      { patientId: string },
      {},
      {},
      { search?: string; status?: PrescriptionStatus; sort?: string }
    >,
    res: Response,
  ) => {
    const { patientId } = req.params;
    const clinicId = req.payload?.clinicId ?? "";
    const { search, status, sort } = req.query;

    const result = await this.prescriptionService.getPrescriptionsByPatientId(
      patientId,
      clinicId,
      search,
      status,
      sort,
    );

    return successResponse(res, 200, result, "Lấy danh sách toa cũ thành công");
  };

  public dispensePrescription = async (
    req: AuthenticatedRequest<{ id: string }, {}, {}, { forceExport?: string }>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const userId = req.payload?.userId ?? "";
    const { id } = req.params;
    const forceExport =
      String(req.query.forceExport ?? "false").toLowerCase() === "true";

    const result = await this.prescriptionService.dispensePrescription(
      id,
      userId,
      forceExport,
      clinicId,
    );

    return successResponse(res, 200, result, "Xuất toa thành công");
  };



  public getPatientsWithPrescriptionsByDate = async (
    req: AuthenticatedRequest<
      {},
      {},
      {},
      { from?: string; to?: string; page?: string; size?: string; isDispended?: string; fullName?: string }
    >,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const normalizedFrom = from?.trim();
    const normalizedTo = to?.trim();
    if (normalizedFrom && !/^\d{4}-\d{2}-\d{2}$/.test(normalizedFrom)) {
      return res.status(400).json({
        message: "Thời gian phải teo định dạng YYYY-MM-DD (theo giờ VN)",
      });
    }
    if (normalizedTo && !/^\d{4}-\d{2}-\d{2}$/.test(normalizedTo)) {
      return res.status(400).json({
        message: "Thời gian phải theo định dạng YYYY-MM-DD (theo giờ VN)",
      });
    }
    if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
      return res.status(400).json({
        message: "From không được lớn hơn To (theo ngày giờ VN)",
      });
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const size = req.query.size ? Number(req.query.size) : 10;
    const fullName = req.query.fullName as string | undefined;

    const rawIsDispensed = req.query.isDispended as string | undefined;
    let isDispensed: boolean | undefined = undefined;
    if (rawIsDispensed !== undefined) {
      const normalized = rawIsDispensed.trim().toLowerCase();
      if (["true", "1"].includes(normalized)) {
        isDispensed = true;
      } else if (["false", "0"].includes(normalized)) {
        isDispensed = false;
      } else {
        return res.status(400).json({
          message: "isDispended chỉ nhận true/false",
        });
      }
    }

    const result =
      await this.prescriptionService.getPatientsWithPrescriptionsByDate(
        normalizedFrom,
        normalizedTo,
        isDispensed,
        fullName,
        page,
        size,
        clinicId,
      );

    return successResponse(
      res,
      200,
      result.items,
      "Lấy danh sách bệnh nhân có toa thuốc thành công",
      result.pagination,
    );
  };

}
