import { Router } from "express";
import { UserRoleEnum } from "@prisma/client";
import { UserController } from "../controllers/user.controller";
import { validateBody, validateParams } from "../../../middlewares/validate";
import {
  CreateUserRequestSchema,
  ForceUpdatePasswordSchema,
} from "../dtos/user.request.dto";
import { UpdateUserRequestSchema } from "../dtos/user.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";
import Joi from "joi";

const UserRouter = Router();
const userController = new UserController();

const IdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
});

UserRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_USER", "User"),
  authorize([UserRoleEnum.Admin]),
  validateBody(CreateUserRequestSchema),
  userController.createUser,
);

UserRouter.get(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  userController.getUsers,
);

UserRouter.get("/me", authenticate, userController.getMyProfile);

UserRouter.put(
  "/change-password",
  authenticate,
  auditLogsMiddleware("CHANGE_PASSWORD", "User"),
  userController.changePassword,
);

UserRouter.get(
  "/roles",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  userController.getUserEnum,
);

UserRouter.get("/status", authenticate, userController.getUserStatus);

UserRouter.put(
  "/:id",
  authenticate,
  auditLogsMiddleware("UPDATE_USER", "User"),
  authorize([UserRoleEnum.Admin]),
  validateBody(UpdateUserRequestSchema),
  userController.updateUser,
);

UserRouter.put(
  "/:id/force-password",
  authenticate,
  auditLogsMiddleware("CHANGE_USER_PASS", "User"),
  authorize([UserRoleEnum.Admin]),
  validateBody(ForceUpdatePasswordSchema),
  userController.updateUserPassword,
);

UserRouter.get(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin, UserRoleEnum.Manager]),
  validateParams(IdParamSchema),
  userController.getUserById,
);

export default UserRouter;
