import multer from "multer";
import { HttpError } from "../errors/HttpError.ts";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new HttpError(
          400,
          "Invalid file format. Only JPEG, PNG, and WebP are allowed",
        ),
      );
    }
  },
});
