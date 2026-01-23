import { Router } from "express";
import { FileController } from "../controllers/file.controller";
import { uploadFile } from "../../../middlewares/upload.middleware";
import { authenticate } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const fileRouter = Router();
const fileController = new FileController();

fileRouter.post(
  "/upload",
  authenticate,
  auditLogsMiddleware("UPLOAD_FILE", "File"),
  uploadFile.single("file"),
  fileController.uploadFile
);

fileRouter.get(
  "/",
  authenticate,
  fileController.getFiles
);

fileRouter.post(
  "/delete",
  authenticate,
  auditLogsMiddleware("DELETE_FILE", "File"),
  fileController.deleteFileByPath
);

fileRouter.delete(
  "/service-results/:requestId",
  authenticate,
  auditLogsMiddleware("DELETE_SERVICE_RESULTS", "ServiceResult"),
  fileController.deleteResultsByRequest
);

fileRouter.get(
  "/medical-record/:recordId",
  authenticate,
  fileController.getFileByMedicalRecordId
);

export default fileRouter;
