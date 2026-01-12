import { Router } from "express";
import { FileController } from "../controllers/file.controller";
import { uploadFile } from "../../../middlewares/upload.middleware";
import { authenticate } from "../../../middlewares/auth.middleware";

const fileRouter = Router();
const fileController = new FileController();

fileRouter.post(
  "/upload",
  authenticate,
  uploadFile.single("file"),
  fileController.uploadFile
);

fileRouter.post("/delete", authenticate, fileController.deleteFile);

fileRouter.get(
  "/medical-record/:recordId",
  authenticate,
  fileController.getFileByMedicalRecordId
);

export default fileRouter;
