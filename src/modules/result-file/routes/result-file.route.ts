import { Router } from "express";
import { ResultFileController } from "../controllers/result-file.controller";
import { uploadResultFile } from "../../../middlewares/upload.middleware";
import { authenticate } from "../../../middlewares/auth.middleware";

const resultFileRouter = Router();
const resultFileController = new ResultFileController();

resultFileRouter.post(
  "/uploads/",
  authenticate,
  uploadResultFile.array("files", 10),
  resultFileController.uploadFiles,
);

// resultFileRouter.get(
//   "/service-request/:requestId",
//   authenticate,
//   resultFileController.
// );

export default resultFileRouter;