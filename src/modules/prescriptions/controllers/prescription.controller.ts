import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { UpsertDianosisPrescriptionDto } from "../dtos/prescription.request.dto";
import { PrecriptionService } from "../services/prescription.service";

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

    const result = await this.prescriptionService.printPrescriptionPdf(
      id,
      clinicId,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.prescriptionCode}.pdf"`,
    );

    return res.send(result.buffer);
  };
}
