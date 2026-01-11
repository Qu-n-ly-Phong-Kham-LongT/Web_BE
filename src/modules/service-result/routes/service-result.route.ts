import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { UserRoleEnum } from "@prisma/client";
import { ServiceResultController } from "../controllers/service-result.controller";
import { createServiceResultBulkSchema } from "../dtos/service-result.request.dto";

const serviceResultRouter = Router();
const controller = new ServiceResultController();

serviceResultRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Doctor]),
  validateBody(createServiceResultBulkSchema),
  controller.createServiceResultsBulk
);

serviceResultRouter.put(
  "/",
  authenticate,
  authorize([UserRoleEnum.Doctor]),
  validateBody(createServiceResultBulkSchema),
  controller.upsertServiceResultsBulk
);

export default serviceResultRouter;
