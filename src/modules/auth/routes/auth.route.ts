import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../../../middlewares/validate";
import { LoginRequestSchema } from "../dtos/login.request.dto";
import { RefreshRequestSchema } from "../dtos/refresh.request.dto";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
  "/login",
  auditLogsMiddleware("LOGIN", "Auth"),
  validateBody(LoginRequestSchema),
  authController.login,
);

authRouter.post(
  "/refresh",
  validateBody(RefreshRequestSchema),
  authController.refresh,
);

authRouter.post(
  "/logout",
  validateBody(RefreshRequestSchema),
  authController.logout,
);

export default authRouter;
