import type { NextFunction, Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import type { CreateRecipeInput } from "../schemas/recipesSchemas.ts";
import * as recipesService from "../services/recipesService.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

export const validateRecipeReferences = ctrlWrapper(
  async (req: Request, _res: Response, next: NextFunction) => {
    const errors = await recipesService.findReferenceErrors(
      req.body as CreateRecipeInput,
    );

    if (errors.length > 0) {
      throw createHttpError(400, "Validation error", errors);
    }

    next();
  },
);
