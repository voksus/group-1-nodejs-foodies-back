import { prisma } from "../db.ts";

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    select: {
      id: true,
      testimonial: true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { id: "asc" },
  });
}
