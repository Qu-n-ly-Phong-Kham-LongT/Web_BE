import { Response } from "express"
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { SharedService } from "../services/shared.service";

export class SharedController {
  private sharedService = new SharedService();

  public getFullMedicalRecord = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.sharedService.getFullMedicalRecord(
      req.params.id,
      clinicId
    );
    return successResponse(res, 200, result, "Lấy bệnh án bệnh nhân thành công");
  };
  public printMedicalRecordPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    const result = await this.sharedService.printMedicalRecordDocx(
      req.params.id,
      clinicId
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.recordCode}.pdf"`
    );
    return res.send(result.buffer);
  };
}
