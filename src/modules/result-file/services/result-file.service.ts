import { ResultFileRepository } from "../repositories/result-file.repository";
import { Request, Response } from "express";
import path from "path";
import { BaseError } from "../../../utils/base-error.util";
import { ResultFileResponseDto } from "../dtos/result-file.response.dto";
import { ResultFileDto } from "../dtos/result-file.request.dto"; 
import { ResultFile } from "@prisma/client";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const normalizeRelativePath = (relativePath: string) =>
  relativePath.replace(/^[/\\]+/, "");

const resolvePublicPath = (relativePath: string) =>
  path.join(PUBLIC_DIR, normalizeRelativePath(relativePath));

export class ResultFileService {
  private resultFileReposity = new ResultFileRepository();

  private mapFileResponse(file: {
    fileID: string;
    relativePath: string;
    size: number;
    mimeType: string;
    createdAt: Date;
  }) {
    return {
      fileId: file.fileID,
      relativePath: file.relativePath,
      url: `${process.env.BASE_URL}${file.relativePath}`,
      size: file.size,
      mimeType: file.mimeType,
      createdAt: file.createdAt,
    };
  }

  public async uploadMultipleFiles(
    files: Express.Multer.File[],
    serviceRequestId: string
  ): Promise<ResultFileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BaseError(404, "Không tìm thấy file để upload");
    }

    const uploadPromises = files.map(async (file) => {
      const relativePath = `/upload/results/${file.filename}`.replace(
        /\\/g,
        "/",
      );

      const dto: ResultFileDto = {
        relativePath,
        mimeType: file.mimetype,
        size: file.size,
        serviceRequestId: serviceRequestId,
      }

      return await this.resultFileReposity.createFileRecord(dto);
    });

    const savedFiles: ResultFile[] = await Promise.all(uploadPromises);
    return savedFiles.map((file) => this.mapFileResponse(file));
  }

  public async getFilesByRequestId(requestId: string): Promise<ResultFileResponseDto[]> {
    const files: ResultFile[] = await this.resultFileReposity.findByServiceRequestId(requestId);
    return files.map((file) => this.mapFileResponse(file));
  }
}
