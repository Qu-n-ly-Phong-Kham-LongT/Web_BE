import { Router } from "express";
import { ServiceNodeController } from "../controllers/service-node.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import {
  createServiceNodeSchema,
  updateServiceNodeSchema,
} from "../dtos/service-node.request.dto";
import { UserRoleEnum } from "@prisma/client";

const serviceNodeRouter = Router();
const controller = new ServiceNodeController();

serviceNodeRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Manager, UserRoleEnum.Admin]),
  validateBody(createServiceNodeSchema),
  controller.create,
);

serviceNodeRouter.put(
  "/:nodeId",
  authenticate,
  authorize([UserRoleEnum.Manager, UserRoleEnum.Admin]),
  validateBody(updateServiceNodeSchema),
  controller.update,
);

serviceNodeRouter.get("/", authenticate, controller.list);

serviceNodeRouter.get("/node-types", authenticate, controller.getNodeTypes);

serviceNodeRouter.get(
  "/categories/:categoryId/types",
  authenticate,
  controller.listTypesByCategory,
);

serviceNodeRouter.delete(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  controller.deleteNode,
);

export default serviceNodeRouter;
