import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { FileService } from "../services/file.service";
import { DeleteFileRequestDto } from "../dtos/delete-file.request.dto";

export class FileController {
  private fileService = new FileService();

  public getFileByMedicalRecordId = async (req: Request, res: Response) => {
    const rawRecordId = req.params.recordId;
    const recordId = Array.isArray(rawRecordId) ? rawRecordId[0] : rawRecordId;
    const result = await this.fileService.findByMedicalRecordId(recordId);
    return successResponse(res, 200, result, "Lấy bệnh án thành công");
  }

  public uploadFile = async (req: Request, res: Response) => {
    const result = await this.fileService.uploadFile(req);
    return successResponse(res, 200, result, "File uploaded successfully");
  };

  public deleteFile = async (req: Request<{}, {}, DeleteFileRequestDto>, res: Response) => {
    const { relativePath } = req.body;
    await this.fileService.deleteByRelativePath(relativePath);
    return successResponse(res, 200, null, "File deleted successfully");
  };
}
