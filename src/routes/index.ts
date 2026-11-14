import { Router } from "express";
import recipesRouter from "./recipesRouter.ts";
import testimonialsRouter from "./testimonialsRouter.ts";
import areasRouter from "./areasRouter.ts";

const apiRouter = Router();

// Точки підключення модульних роутерів команди (відповідно до тікетів Trello):
// [BE-03] apiRouter.use('/auth', authRouter);
// [BE-04] apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/areas', areasRouter);
// [BE-04] apiRouter.use('/ingredients', ingredientsRouter);
// [BE-10] apiRouter.use('/users', usersRouter);
apiRouter.use("/recipes", recipesRouter);

apiRouter.use("/testimonials", testimonialsRouter);

export default apiRouter;
