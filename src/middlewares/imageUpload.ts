import multer from "multer";
import { createHttpError } from "../errors/HttpError.ts";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const imageUpload = multer({
  storage: multer.diskStorage({ destination: "uploads/" }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(createHttpError(415, "Only JPEG, PNG and WebP images are allowed"));
    }

    callback(null, true);
  },
});
