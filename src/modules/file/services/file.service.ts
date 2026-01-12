import { Request } from "express";
import path from "path";
import { BaseError } from "../../../utils/base-error.util";
import { FileRepository } from "../repositories/file.repository";
import { FileType } from "@prisma/client";
import fs from "fs";

const PUBLIC_DIR = path.join(process.cwd(), "public");
export class FileService {
  private fileRepository = new FileRepository();

  public async uploadFile(req: Request): Promise<any> {
    const getQueryString = (value: unknown): string | undefined => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      return undefined;
    };

    if (!req.file) {
      throw new BaseError(400, "Vui lòng chọn file để upload");
    }

    const type = String(req.query.type ?? "") as FileType;
    const medicalRecordId = getQueryString(req.query.medicalRecordId);
    const prescriptionId = getQueryString(req.query.prescriptionId);
    const serviceRequestId = getQueryString(req.query.serviceRequestId);
    const serviceResultId = getQueryString(req.query.serviceResultId);
    const providedIds = [
      medicalRecordId,
      prescriptionId,
      serviceRequestId,
      serviceResultId,
    ].filter(Boolean);

    if (providedIds.length > 1) {
      throw new BaseError(400, "Chỉ bắt buộc điền 1 loại id bản ghi cần lưu");
    }

    const relativePath = path
      .join("/uploads", type, req.file.filename)
      .replace(/\\/g, "/");

    const fileRecord = await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      medicalRecordId,
      prescriptionId,
      serviceRequestId,
      serviceResultId,
    });

    return fileRecord;
  }

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    const fullPath = path.join(PUBLIC_DIR, relativePath);
    await this.fileRepository.deleteByRelativePath(relativePath);

    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      console.error(`Xoá thất bại: ${fullPath}`, err);
      throw new BaseError(500, "Xoá thất bại");
    }
  }

  public async findByMedicalRecordId(recordId: string) {
    const file = await this.fileRepository.findByMedicalRecordId(recordId);
    if (!file) {
      throw new BaseError(404, "Không tìm thấy file")
    }

    return {
      fileId: file.fileID,
      relativePath: file.relativePath,
      url: `${process.env.BASE_URL}${file.relativePath}`,
      type: file.type,
      size: file.size,
      createdAt: file.createdAt
    }
  }
}
