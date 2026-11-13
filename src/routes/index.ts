import { Router } from "express";
import recipeRouter from "./recipeRoutes.ts";
import testimonialsRouter from "./testimonialsRouter.ts";

const apiRouter = Router();

// Точки підключення модульних роутерів команди (відповідно до тікетів Trello):
// [BE-03] apiRouter.use('/auth', authRouter);
// [BE-04] apiRouter.use('/categories', categoriesRouter);
// [BE-04] apiRouter.use('/areas', areasRouter);
// [BE-04] apiRouter.use('/ingredients', ingredientsRouter);
// [BE-06] / [BE-07] / [BE-08] / [BE-09] apiRouter.use('/recipes', recipesRouter);
// [BE-10] apiRouter.use('/users', usersRouter);
apiRouter.use("/recipes", recipeRouter);

apiRouter.use("/testimonials", testimonialsRouter);

export default apiRouter;
