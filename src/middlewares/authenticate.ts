import type { RequestHandler } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import { optionalAuthenticate } from "./optionalAuthenticate.ts";

export const authenticate: RequestHandler = (req, res, next) => {
  optionalAuthenticate(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.user) {
      next(createHttpError(401));
      return;
    }
    next();
  });
};
