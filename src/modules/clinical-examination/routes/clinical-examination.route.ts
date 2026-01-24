import { Router } from "express";
import { ClinicalExaminationController } from "../controllers/clinical-examination.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ClinicalExaminationRequestSchema } from "../dtos/clinical-examination.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const clinicalExaminationRouter = Router({ mergeParams: true });
const clinicalExaminationController = new ClinicalExaminationController();

clinicalExaminationRouter.put(
  "/:recordId/clinical-examinations",
  authenticate,
  auditLogsMiddleware("CREATE_CLINICAL_EXAMINATION", "ClinicalExamination"),
  validateBody(ClinicalExaminationRequestSchema),
  clinicalExaminationController.createClinicalExamination
);

export default clinicalExaminationRouter;
