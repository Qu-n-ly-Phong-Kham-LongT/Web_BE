import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ServiceRequestController } from "../controllers/service-request.controller";
import { createServiceRequestSchema } from "../dtos/service-request.request.dto";

const serviceRequestRouter = Router();
const controller = new ServiceRequestController();

serviceRequestRouter.post(
  "/",
  authenticate,
  validateBody(createServiceRequestSchema),
  controller.create
);

serviceRequestRouter.get(
  "/:id",
  authenticate,
  controller.getById
);

export default serviceRequestRouter;
