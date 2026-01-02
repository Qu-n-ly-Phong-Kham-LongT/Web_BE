import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../../../middlewares/validate";
import { RegisterRequestSchema } from "../dtos/register.request.dto";

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
    "/register",
    validateBody(RegisterRequestSchema),
    authController.register
);

authRouter.get(
    "/users/:id",
    authController.getUserById
);


export default authRouter;