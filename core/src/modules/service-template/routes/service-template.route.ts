import { Router } from "express";
import { ServiceTemplateController } from "../controllers/service-template.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreateServiceTemplateRequestSchema } from "../dtos/create-service-template.request.dto";
import { UpdateServiceTemplateRequestSchema } from "../dtos/update-service-template.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { UserRoleEnum } from "@prisma/client";

const serviceTemplateRouter = Router();

const serviceTemplateController = new ServiceTemplateController();

serviceTemplateRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(CreateServiceTemplateRequestSchema),
  serviceTemplateController.createServiceTemplate,
);

serviceTemplateRouter.get(
  "/",
  authenticate,
  serviceTemplateController.getServiceTemplates,
);

serviceTemplateRouter.get(
  "/active-items",
  authenticate,
  serviceTemplateController.getServiceTemplatesForDoctor,
);

serviceTemplateRouter.get(
  "/:id",
  authenticate,
  serviceTemplateController.getServiceTemplateById,
);

serviceTemplateRouter.put(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(UpdateServiceTemplateRequestSchema),
  serviceTemplateController.updateServiceTemplate,
);

serviceTemplateRouter.delete(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  serviceTemplateController.deleteServiceTemplate,
);

export default serviceTemplateRouter;
