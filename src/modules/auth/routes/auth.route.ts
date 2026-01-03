import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../../../middlewares/validate";
import { LoginRequestSchema } from "../dtos/login.request.dto";
import { RefreshRequestSchema } from "../dtos/refresh.request.dto";

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
    "/login",
    validateBody(LoginRequestSchema),
    authController.login
);

authRouter.post(
    "/refresh",
    validateBody(RefreshRequestSchema),
    authController.refresh
);

authRouter.post(
    "/logout",
    validateBody(RefreshRequestSchema),
    authController.logout
);

authRouter.get(
    "/users/:id",
    authController.getUserById
);

export default authRouter;