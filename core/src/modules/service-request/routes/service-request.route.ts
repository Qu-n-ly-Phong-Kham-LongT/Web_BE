import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { ServiceRequestController } from "../controllers/service-request.controller";
import {
  createServiceRequestSchema,
  BasicServiceRequestWithDateSchema,
} from "../dtos/service-request.request.dto";
import { UserRoleEnum } from "@prisma/client";

const serviceRequestRouter = Router();
const controller = new ServiceRequestController();

serviceRequestRouter.post(
  "/init",
  authenticate,
  controller.initRequest,
);

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

serviceRequestRouter.post(
  "/raw",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(BasicServiceRequestWithDateSchema),
  controller.createRawRequestWithDate,
);

serviceRequestRouter.get("/:id", authenticate, controller.getById);

serviceRequestRouter.get(
  "/:id/print",
  authenticate,
  controller.printServiceRequestPdf,
);

export default serviceRequestRouter;
