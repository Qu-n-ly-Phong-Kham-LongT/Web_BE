import { Router } from "express";
import { ServiceItemController } from "../controllers/service-item.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import {
  createServiceItemSchema,
  updateServiceItemSchema,
  updateServiceItemStatusSchema,
} from "../dtos/service-item.request.dto";
import { UserRoleEnum } from "@prisma/client";

const serviceItemRouter = Router();

const controller = new ServiceItemController();

serviceItemRouter.get("/input-types", controller.getAllInputTypes);

serviceItemRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(createServiceItemSchema),
  controller.create,
);

serviceItemRouter.get("/", authenticate, controller.getAll);

serviceItemRouter.get("/:id", authenticate, controller.getById);

serviceItemRouter.put(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(updateServiceItemSchema),
  controller.update,
);

serviceItemRouter.put(
  "/:id/status",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(updateServiceItemStatusSchema),
  controller.udpateStatus,
);

serviceItemRouter.delete(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  controller.deleteServiceItem,
);

export default serviceItemRouter;
