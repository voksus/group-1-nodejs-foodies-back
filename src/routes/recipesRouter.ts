import { Router } from "express";
import "../docs/recipes.ts";
import {
  getPopularRecipes,
  getRecipes,
} from "../controllers/recipesController.ts";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  PopularRecipesQuerySchema,
  RecipesQuerySchema,
} from "../schemas/recipesSchemas.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const recipesRouter = Router();

recipesRouter.get(
  "/popular",
  optionalAuthenticate,
  validateRequest({ query: PopularRecipesQuerySchema }),
  ctrlWrapper(getPopularRecipes),
);

recipesRouter.get(
  "/",
  optionalAuthenticate,
  validateRequest({ query: RecipesQuerySchema }),
  ctrlWrapper(getRecipes),
);

export default recipesRouter;
