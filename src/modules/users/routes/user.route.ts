import { Router } from "express";
import { UserRoleEnum } from "@prisma/client";
import { UserController } from "../controllers/user.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreateUserRequestSchema } from "../dtos/create-user.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import authRouter from "../../auth/routes/auth.route";

const UserRouter = Router();
const userController = new UserController();

UserRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  validateBody(CreateUserRequestSchema),
  userController.createUser
);


export default UserRouter;