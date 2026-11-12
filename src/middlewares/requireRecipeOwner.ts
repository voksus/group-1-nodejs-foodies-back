import type { NextFunction, Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import * as recipeService from "../services/recipeService.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

export const requireRecipeOwner = ctrlWrapper(
  async (req: Request, _res: Response, next: NextFunction) => {
    const ownerId = await recipeService.findRecipeOwnerId(req.params.id);

    if (ownerId === null) {
      throw createHttpError(404, "Recipe not found");
    }
    if (ownerId !== req.auth.userId) {
      throw createHttpError(403, "Access denied");
    }

    next();
  },
);
