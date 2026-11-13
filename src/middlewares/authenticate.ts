import type { NextFunction, Request, Response } from "express";

export const authenticate = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next();
};
