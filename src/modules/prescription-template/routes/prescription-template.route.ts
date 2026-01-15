import { Router } from "express";
import { PrescriptionTemplateController } from "../controllers/prescription-template.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreatePrescriptionTemplateRequestSchema } from "../dtos/create-prescription-template.request.dto";
import { UpdatePrescriptionTemplateRequestSchema } from "../dtos/update-prescription-template.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { UserRoleEnum } from "@prisma/client";

const prescriptionTemplateRouter = Router();

const prescriptionTemplateController = new PrescriptionTemplateController();

prescriptionTemplateRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(CreatePrescriptionTemplateRequestSchema),
  prescriptionTemplateController.createPrescriptionTemplate
);

prescriptionTemplateRouter.get(
  "/",
  authenticate,
  prescriptionTemplateController.getPrescriptionTemplates
);

prescriptionTemplateRouter.get(
  "/:id",
  authenticate,
  prescriptionTemplateController.getPrescriptionTemplateById
);

prescriptionTemplateRouter.put(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(UpdatePrescriptionTemplateRequestSchema),
  prescriptionTemplateController.updatePrescriptionTemplate
);

export default prescriptionTemplateRouter;


