import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { FileService } from "../services/file.service";

export class FileController {
  private fileService = new FileService();

  public uploadFile = async (req: Request, res: Response) => {
    const type = req.query.type as string;
    console.log("File type:", type);
    // return this.fileService.uploadFile(type);
    return successResponse(res, 200, { type }, "File uploaded successfully");
  };
}
