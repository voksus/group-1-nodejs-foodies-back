import type { Request, Response, NextFunction, RequestHandler } from "express";

export const ctrlWrapper = (
    ctrl: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await ctrl(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};
