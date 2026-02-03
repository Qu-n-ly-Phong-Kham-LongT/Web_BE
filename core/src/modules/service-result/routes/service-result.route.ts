import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { UserRoleEnum } from "@prisma/client";
import { ServiceResultController } from "../controllers/service-result.controller";
import { createServiceResultBulkSchema } from "../dtos/service-result.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const serviceResultRouter = Router();
const controller = new ServiceResultController();

serviceResultRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_SERVICE_RESULT", "ServiceResult"),
  authorize([UserRoleEnum.Doctor]),
  validateBody(createServiceResultBulkSchema),
  controller.createServiceResultsBulk
);

serviceResultRouter.put(
  "/",
  authenticate,
  auditLogsMiddleware("UPSERT_SERVICE_RESULT", "ServiceResult"),
  authorize([UserRoleEnum.Doctor]),
  validateBody(createServiceResultBulkSchema),
  controller.upsertServiceResultsBulk
);

export default serviceResultRouter;
