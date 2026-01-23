import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ServiceRequestController } from "../controllers/service-request.controller";
import { createServiceRequestSchema } from "../dtos/service-request.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const serviceRequestRouter = Router();
const controller = new ServiceRequestController();

serviceRequestRouter.post(
  "/init",
  authenticate,
  auditLogsMiddleware("INIT_SERVICE_REQUEST", "ServiceRequest"),
  controller.initRequest
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

serviceRequestRouter.get("/:id", authenticate, controller.getById);

serviceRequestRouter.get(
  "/:id/print",
  auditLogsMiddleware("PRINT_SERVICE_REQUEST", "ServiceRequest"),
  controller.printServiceRequestPdf
);

export default serviceRequestRouter;
