import type { Request, Response } from "express";
import { createHttpError } from "../errors/HttpError.ts";
import type { CreateRecipeInput } from "../schemas/recipesSchemas.ts";
import * as recipesService from "../services/recipesService.ts";

export const createRecipe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.file) {
    throw createHttpError(400, "Recipe image is required");
  }

  const recipe = await recipesService.createRecipe(
    req.user.id,
    req.body as CreateRecipeInput,
    req.file.path,
  );

  res.status(201).json(recipe);
};

export const deleteRecipe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await recipesService.deleteRecipe(req.params.id);

  res.status(204).end();
};
