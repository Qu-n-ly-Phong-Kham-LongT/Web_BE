import { Router } from "express";
import Joi from "joi";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { ClinicController } from "../controllers/clinic.controller";
import { UserRoleEnum } from "@prisma/client";
import { validateParams } from "../../../middlewares/validate";

const ClinicRouter = Router();
const clinicController = new ClinicController();

const IdParamSchema = Joi.object({
  id: Joi .string()
    .guid({ version: ["uuidv4"] })
    .required(),
});

ClinicRouter.get(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin, UserRoleEnum.Manager, UserRoleEnum.Doctor]),
  validateParams(IdParamSchema),
  clinicController.getClinicById
);

export default ClinicRouter;
