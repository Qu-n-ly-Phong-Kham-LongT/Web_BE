import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateParams } from "../../../middlewares/validate";
import { PrintJobController } from "../controllers/print-job.controller";
import { PrintJobIdParamSchema } from "../dtos/print-job.request.dto";

const printJobRouter = Router();
const printJobController = new PrintJobController();

printJobRouter.get(
  "/:jobId",
  authenticate,
  validateParams(PrintJobIdParamSchema),
  printJobController.getJobStatus,
);

export default printJobRouter;
