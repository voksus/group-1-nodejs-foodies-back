import { Router } from "express";
import { getTestimonials } from "../controllers/testimonials.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

const testimonialsRouter = Router();

testimonialsRouter.get("/", ctrlWrapper(getTestimonials));

export default testimonialsRouter;
