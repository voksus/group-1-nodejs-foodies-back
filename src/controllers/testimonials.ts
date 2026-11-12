import type { Request, Response } from "express";
import prisma from "../db.ts";

export const getTestimonials = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const testimonials = await prisma.testimonial.findMany({
    select: {
      id: true,
      testimonial: true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { id: "asc" },
  });

  res.status(200).json(testimonials);
};
