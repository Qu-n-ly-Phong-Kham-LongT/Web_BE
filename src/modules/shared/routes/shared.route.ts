import { Router } from "express";
import { SharedController } from "../controllers/shared.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const sharedRouter = Router();
const controller = new SharedController();

sharedRouter.get("/:id/full", authenticate, controller.getFullMedicalRecord);
sharedRouter.get("/:id/print", authenticate, controller.printMedicalRecordPdf);

export default sharedRouter;