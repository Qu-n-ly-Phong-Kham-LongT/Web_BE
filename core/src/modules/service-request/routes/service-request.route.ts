import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ServiceRequestController } from "../controllers/service-request.controller";
import {
  createServiceRequestSchema,
  BasicServiceRequestWithDateSchema,
} from "../dtos/service-request.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";
import { UserRoleEnum } from "@prisma/client";

const serviceRequestRouter = Router();
const controller = new ServiceRequestController();

serviceRequestRouter.post(
  "/init",
  authenticate,
  auditLogsMiddleware("INIT_SERVICE_REQUEST", "ServiceRequest"),
  controller.initRequest,
);

serviceRequestRouter.put(
  "/:requestId",
  authenticate,
  auditLogsMiddleware("UPDATE_SERVICE_REQUEST", "ServiceRequest"),
  validateBody(createServiceRequestSchema),
  controller.saveRequest,
);

serviceRequestRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_SERVICE_REQUEST", "ServiceRequest"),
  validateBody(createServiceRequestSchema),
  controller.create,
);

serviceRequestRouter.post(
  "/raw",
  authenticate,
  auditLogsMiddleware("CREATE_RAW_REQUEST", "ServiceRequest"),
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(BasicServiceRequestWithDateSchema),
  controller.createRawRequestWithDate,
);

serviceRequestRouter.get("/:id", authenticate, controller.getById);

serviceRequestRouter.get(
  "/:id/print",
  authenticate,
  auditLogsMiddleware("PRINT_SERVICE_REQUEST", "ServiceRequest"),
  controller.printServiceRequestPdf,
);

export default serviceRequestRouter;
