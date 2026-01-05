import { Router } from "express";
import { ClinicalExaminationController } from "../controllers/clinical-examination.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ClinicalExaminationRequestSchema } from "../dtos/clinical-examination.request.dto";
import { UserRoleEnum } from "@prisma/client";

const clinicalExaminationRouter = Router({ mergeParams: true });
const clinicalExaminationController = new ClinicalExaminationController();

clinicalExaminationRouter.put(
  "/:recordId/clinical-examinations",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin, UserRoleEnum.Manager]),
  validateBody(ClinicalExaminationRequestSchema),
  clinicalExaminationController.createClinicalExamination
);

export default clinicalExaminationRouter;
