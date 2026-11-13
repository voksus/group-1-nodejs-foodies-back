import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "./config/env.ts";

<<<<<<< HEAD
// TODO [BE-02]: Після злиття PR Василини (prisma/schema.prisma) та виконання `npx prisma generate`
// розкоментувати імпорт PrismaClient і створення екземпляра prisma нижче:
import { PrismaClient } from '../generated/prisma/client.ts';
//import { PrismaClient } from "../generated/prisma/index.js";

=======
>>>>>>> main
export const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
export default prisma;
