import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.ts";
import { createHttpError } from "../errors/HttpError.ts";

// TODO [BE-03]: replace with the real JWT auth middleware. Until then this stub trusts the
// X-User-Id header, so it always rejects in production.
export const authStub = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const userId = req.get("x-user-id");

  if (env.NODE_ENV === "production" || !userId) {
    next(createHttpError(401, "Authentication required"));
    return;
  }

  req.user = { id: userId, sub: userId };
  next();
};
