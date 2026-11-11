import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
}

export const validateRequest = (schemas: ValidationSchemas): RequestHandler => {
    return async (
        req: Request,
        _res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                req.query = (await schemas.query.parseAsync(
                    req.query,
                )) as Request["query"];
            }
            if (schemas.params) {
                req.params = (await schemas.params.parseAsync(
                    req.params,
                )) as Request["params"];
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
