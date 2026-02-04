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
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const serviceItemRouter = Router();

const controller = new ServiceItemController();

serviceItemRouter.get("/input-types", controller.getAllInputTypes);

serviceItemRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_SERVICE_ITEM", "ServiceItem"),
  authorize([UserRoleEnum.Admin]),
  validateBody(createServiceItemSchema),
  controller.create,
);

serviceItemRouter.get("/", authenticate, controller.getAll);

serviceItemRouter.get("/:id", authenticate, controller.getById);

serviceItemRouter.put(
  "/:id",
  authenticate,
  auditLogsMiddleware("UPDATE_SERVICE_ITEM", "ServiceItem"),
  authorize([UserRoleEnum.Admin]),
  validateBody(updateServiceItemSchema),
  controller.update,
);

serviceItemRouter.put(
  "/:id/status",
  authenticate,
  auditLogsMiddleware("UPDATE_SERVICE_ITEM_STATUS", "ServiceItem"),
  authorize([UserRoleEnum.Admin]),
  validateBody(updateServiceItemStatusSchema),
  controller.udpateStatus,
);

export default serviceItemRouter;
