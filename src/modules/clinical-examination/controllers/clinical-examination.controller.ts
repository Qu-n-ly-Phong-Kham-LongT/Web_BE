import { Response } from "express";
import { AuthenticatedRequest, authorize, authenticate } from "../../../middlewares/auth.middleware";
import { successResponse } from "../../../utils/response.util";
import { ClinicalExaminationService } from "../services/clinical-examination.service";
import { ClinicalExaminationRequestDto } from "../dtos/clinical-examination.request.dto";
import { BaseError } from "../../../utils/base-error.util";

export class ClinicalExaminationController {
  private clinicalExaminationService = new ClinicalExaminationService();

  public createClinicalExamination = async (
    req: AuthenticatedRequest<{ recordId: string }, {}, ClinicalExaminationRequestDto>,
    res: Response
  ) => {
    const { payload } = req;
    if (!payload?.userId || !payload.clinicId) {
      throw new BaseError(401, "Thiếu thông tin bác sĩ hoặc phòng khám trong token");
    }

    const dto: ClinicalExaminationRequestDto = {
      ...req.body,
      recordId: req.params.recordId,
    };

    const result = await this.clinicalExaminationService.upsertClinicalExamination(
      dto,
      payload.userId,
      payload.clinicId
    );
    return successResponse(res, 200, result, "Khám lâm sàng thành công");
  };
}
