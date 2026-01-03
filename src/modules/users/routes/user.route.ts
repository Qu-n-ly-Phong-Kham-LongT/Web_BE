import { Router } from "express";
import { UserRoleEnum } from "@prisma/client";
import { UserController } from "../controllers/user.controller";
import { validateBody, validateParams } from "../../../middlewares/validate";
import { CreateUserRequestSchema } from "../dtos/create-user.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import Joi from "joi";

const UserRouter = Router();
const userController = new UserController();

const IdParamSchema = Joi.object({
  id: Joi.string().guid({ version: ["uuidv4"] }).required(),
});

UserRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(CreateUserRequestSchema),
  userController.createUser
);

UserRouter.get(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin, UserRoleEnum.Manager]),
  validateParams(IdParamSchema),
  userController.getUserById
);

export default UserRouter;