import { Router } from "express";
import Joi from "joi";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { ClinicController } from "../controllers/clinic.controller";
import { UserRoleEnum } from "@prisma/client";
import { validateBody, validateParams } from "../../../middlewares/validate";
import { ClinicRequestSchema } from "../dtos/clinic.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const ClinicRouter = Router();
const clinicController = new ClinicController();

const IdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
});

ClinicRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_CLINIC", "Clinic"),
  authorize([UserRoleEnum.Admin]),
  validateBody(ClinicRequestSchema),
  clinicController.createClinic
);

ClinicRouter.get(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  clinicController.getClinics
);

ClinicRouter.put(
  "/:id",
  authenticate,
  auditLogsMiddleware("UPDATE_CLINIC", "Clinic"),
  authorize([UserRoleEnum.Admin]),
  validateBody(ClinicRequestSchema),
  clinicController.updateClinic
)

ClinicRouter.get(
  "/:id",
  authenticate,
  validateParams(IdParamSchema),
  clinicController.getClinicById
);

export default ClinicRouter;
