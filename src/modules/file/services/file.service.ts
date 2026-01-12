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
    if (!req.file) {
      throw new BaseError(400, "No file uploaded");
    }

    const type = String(req.query.type ?? "") as FileType;

    const relativePath = path
      .join("/uploads", type, req.file.filename)
      .replace(/\\/g, "/");

    const fileRecord = await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return fileRecord;
  };

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    const fullPath = path.join(PUBLIC_DIR, relativePath);
    await this.fileRepository.deleteByRelativePath(relativePath);

    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      console.error(`Failed to delete file at path: ${fullPath}`, err);
      throw new BaseError(500, "Failed to delete file from filesystem");
    }

  };
}
