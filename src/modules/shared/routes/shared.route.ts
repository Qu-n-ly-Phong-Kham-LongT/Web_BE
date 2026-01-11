import { Router } from "express";
import { SharedController } from "../controllers/shared.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const sharedRouter = Router();
const controller = new SharedController();

sharedRouter.get("/:id/full", authenticate, controller.getFullMedicalRecord);

export default sharedRouter;