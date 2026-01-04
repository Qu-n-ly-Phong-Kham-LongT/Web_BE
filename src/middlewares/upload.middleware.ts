import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { FileType } from "../constants/file-type.constant";
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
      return cb(new BaseError(400, "Invalid type"), "");
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

export const uploadFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
