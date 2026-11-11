import type { Request, Response, NextFunction } from "express";
import { createHttpError } from "../errors/HttpError.ts";

export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    next(
        createHttpError(
            404,
            `Route ${req.method} ${req.originalUrl} not found`,
        ),
    );
};
