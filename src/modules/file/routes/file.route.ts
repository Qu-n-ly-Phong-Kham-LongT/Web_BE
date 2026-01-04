import { Router } from "express";
import { FileController } from "../controllers/file.controller";

const fileRouter = Router();
const fileController = new FileController();

fileRouter.post("/upload", fileController.uploadFile);

export default fileRouter;
