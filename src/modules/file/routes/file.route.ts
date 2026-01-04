import { Router } from "express";
import { FileController } from "../controllers/file.controller";
import { uploadFile } from "../../../middlewares/upload.middleware";

const fileRouter = Router();
const fileController = new FileController();

fileRouter.post(
    "/upload",
    uploadFile.single("file"),
    fileController.uploadFile
);

fileRouter.post(
    "/delete",
    fileController.deleteFile
);

export default fileRouter;
