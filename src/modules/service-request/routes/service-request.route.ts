import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ServiceRequestController } from "../controllers/service-request.controller";
import { createServiceRequestSchema } from "../dtos/service-request.request.dto";

const serviceRequestRouter = Router();
const controller = new ServiceRequestController();

serviceRequestRouter.post("/init", authenticate, controller.initRequest);

serviceRequestRouter.put(
  "/:requestId",
  authenticate,
  validateBody(createServiceRequestSchema),
  controller.saveRequest,
);

serviceRequestRouter.post(
  "/",
  authenticate,
  validateBody(createServiceRequestSchema),
  controller.create,
);

serviceRequestRouter.get("/:id", authenticate, controller.getById);

serviceRequestRouter.get("/:id/print", controller.printServiceRequestPdf);

export default serviceRequestRouter;
