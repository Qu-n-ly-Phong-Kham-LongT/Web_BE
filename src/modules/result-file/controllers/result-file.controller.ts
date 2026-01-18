import { Request, Response } from 'express'
import { successResponse } from "../../../utils/response.util";
import { ResultFileService } from "../services/result-file.service";

export class ResultFileController {
  private resultFileService = new ResultFileService();

  public uploadFiles = async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const { serviceRequestId } = req.body;

    const result = await this.resultFileService.uploadMultipleFiles(files, serviceRequestId);
    return successResponse(res, 200, result, "Upload kết quả thành công");
  };
}
