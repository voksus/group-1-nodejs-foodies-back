import type { NextFunction, Request, Response } from "express";
import { fileTypeFromFile } from "file-type";
import { createHttpError } from "../errors/HttpError.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";
import { ALLOWED_IMAGE_TYPES } from "./imageUpload.ts";

export const validateImageContent = ctrlWrapper(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      next();
      return;
    }

    const type = await fileTypeFromFile(req.file.path);

    if (!type || !ALLOWED_IMAGE_TYPES.includes(type.mime)) {
      throw createHttpError(415, "Only JPEG, PNG and WebP images are allowed");
    }

    next();
  },
);
