import type { NextFunction, Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import * as recipeService from "../services/recipeService.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";
import type { CreateRecipeInput } from "../validators/recipeValidator.ts";

export const validateRecipeReferences = ctrlWrapper(
  async (req: Request, _res: Response, next: NextFunction) => {
    const errors = await recipeService.findReferenceErrors(
      req.body as CreateRecipeInput,
    );

    if (errors.length > 0) {
      throw createHttpError(400, "Validation error", errors);
    }

    next();
  },
);
