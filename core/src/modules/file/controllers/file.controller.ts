import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { FileService } from "../services/file.service";
import { DeleteFileRequestDto } from "../dtos/delete-file.request.dto";
import { FileType } from "@prisma/client";

export class FileController {
  private fileService = new FileService();

  public getFileByMedicalRecordId = async (req: Request, res: Response) => {
    const rawRecordId = req.params.recordId;
    const recordId = Array.isArray(rawRecordId) ? rawRecordId[0] : rawRecordId;
    const result = await this.fileService.findByMedicalRecordId(recordId);
    return successResponse(res, 200, result, "Lấy bệnh án thành công");
  };

  public uploadFile = async (req: Request, res: Response) => {
    const result = await this.fileService.uploadFile(req);
    return successResponse(res, 200, result, "File uploaded successfully");
  };

  public deleteFileByPath = async (
    req: Request<{}, {}, DeleteFileRequestDto>,
    res: Response,
  ) => {
    const { relativePath } = req.body;
    await this.fileService.deleteByRelativePath(relativePath);
    return successResponse(res, 200, null, "Xoá file thành công");
  };

  public deleteResultsByRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params as { requestId: string };

    await this.fileService.deleteServiceResults(requestId);

    return successResponse(res, 200, null, "Xoá các file kết quả thành công")
  };

  public getFiles = async (req: Request, res: Response) => {
    const result = await this.fileService.getFiles({
      type: req.query.type as FileType,
      id: req.query.id as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      size: req.query.size ? Number(req.query.size) : undefined,
      sort: req.query.sort as string,
    });
    res.json(result);
  };
}
