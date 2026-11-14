import { prisma } from "../db.ts";

export async function listAreas() {
  return prisma.area.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}