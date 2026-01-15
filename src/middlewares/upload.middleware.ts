import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { FileType } from "@prisma/client";
import { BaseError } from "../utils/base-error.util";
import { formatFileName } from "../utils/file-name.util";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const rawType = String(req.query.type ?? "");

    if (!Object.values(FileType).includes(rawType as FileType)) {
      return cb(new BaseError(400, "Loại file không hợp lệ"), "");
    }

    const dir = path.join(process.cwd(), "public", "uploads", rawType);
    ensureDir(dir);

    cb(null, dir);
  },

  filename: (_req, file, cb) => {
    const formatted = formatFileName(file.originalname);
    cb(null, formatted);
  },
});

const allowedExts = new Set([".jpg", ".jpeg", ".docx", ".pdf"]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const uploadFile = multer({
  storage,
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowed =
      allowedExts.has(ext) && allowedMimeTypes.has(file.mimetype);

    if (!isAllowed) {
      return cb(
        new BaseError(400, "Chỉ hỗ trợ file .jpg, .jpeg, .docx, .pdf")
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
