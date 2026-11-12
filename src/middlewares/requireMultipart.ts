import type { NextFunction, Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";

export const requireMultipart = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.is("multipart/form-data")) {
    next(createHttpError(415, "Content-Type must be multipart/form-data"));
    return;
  }

  next();
};
