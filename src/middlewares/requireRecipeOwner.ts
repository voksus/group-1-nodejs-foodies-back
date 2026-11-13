import type { NextFunction, Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import * as recipesService from "../services/recipesService.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

export const requireRecipeOwner = ctrlWrapper(
  async (req: Request, _res: Response, next: NextFunction) => {
    const ownerId = await recipesService.findRecipeOwnerId(req.params.id);

    if (ownerId === null) {
      throw createHttpError(404, "Recipe not found");
    }
    if (ownerId !== req.user.id) {
      throw createHttpError(403, "Access denied");
    }

    next();
  },
);
