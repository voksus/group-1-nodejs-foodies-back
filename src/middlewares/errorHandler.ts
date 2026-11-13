import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../errors/HttpError.ts";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  if (typeof err === "object" && err !== null && "code" in err) {
    const prismaCode = (err as { code?: string }).code;
    if (prismaCode === "P2002") {
      res.status(409).json({
        message: "Resource with this unique value already exists",
      });
      return;
    }
    if (prismaCode === "P2025") {
      res.status(404).json({
        message: "Requested record not found",
      });
      return;
    }
    if (prismaCode === "P2003") {
      res.status(400).json({
        message: "Referenced record does not exist",
      });
      return;
    }
  }

  if ((err as { type?: string } | null)?.type === "entity.parse.failed") {
    res.status(400).json({
      message: "Invalid JSON in request body",
    });
    return;
  }

  req.log.error({ err }, "Unhandled error");

  res.status(500).json({
    message: "Internal Server Error",
  });
};
