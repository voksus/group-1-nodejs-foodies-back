import { Router } from "express";
import "../docs/recipes.ts";
import "../docs/favorites.ts";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../controllers/favoritesController.ts";
import {
  getPopularRecipes,
  getRecipes,
} from "../controllers/recipesController.ts";
import { authenticate } from "../middlewares/authenticate.ts";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  FavoriteRecipeParamsSchema,
  FavoritesQuerySchema,
} from "../schemas/favoritesSchemas.ts";
import {
  PopularRecipesQuerySchema,
  RecipesQuerySchema,
} from "../schemas/recipesSchemas.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const recipesRouter = Router();

recipesRouter.get(
  "/favorites",
  authenticate,
  validateRequest({ query: FavoritesQuerySchema }),
  ctrlWrapper(getFavorites),
);

recipesRouter.post(
  "/:id/favorite",
  authenticate,
  validateRequest({ params: FavoriteRecipeParamsSchema }),
  ctrlWrapper(addFavorite),
);

recipesRouter.delete(
  "/:id/favorite",
  authenticate,
  validateRequest({ params: FavoriteRecipeParamsSchema }),
  ctrlWrapper(removeFavorite),
);

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
