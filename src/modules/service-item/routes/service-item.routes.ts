import { Router } from "express";
import { ServiceItemController } from "../controllers/service-item.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { createServiceItemSchema } from "../dtos/service-item.request.dto";
import { UserRoleEnum } from "@prisma/client";

const serviceItemRouter = Router();

const controller = new ServiceItemController();

serviceItemRouter.get(
  "/input-types",
  controller.getAllInputTypes
);

serviceItemRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(createServiceItemSchema),
  controller.create
);  

serviceItemRouter.get(
  "/",
  authenticate,
  controller.getAll
);

serviceItemRouter.get(
  "/:id",
  authenticate,
  controller.getById
);

export default serviceItemRouter;