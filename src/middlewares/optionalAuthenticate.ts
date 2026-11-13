import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { prisma } from "../db.ts";
import { createHttpError } from "../errors/HttpError.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

export const optionalAuthenticate = ctrlWrapper(async (req, _res, next) => {
  const authorization = req.get("Authorization");
  let token: unknown = req.cookies?.accessToken;

  if (authorization !== undefined) {
    const bearer = /^Bearer\s+(\S+)$/i.exec(authorization);
    if (!bearer) throw createHttpError(401, "Invalid access token");
    token = bearer[1];
  }

  if (token === undefined) {
    next();
    return;
  }
  if (typeof token !== "string" || !token) {
    throw createHttpError(401, "Invalid access token");
  }

  let payload: jwt.JwtPayload | string;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw createHttpError(401, "Invalid or expired access token");
  }
  if (typeof payload === "string") {
    throw createHttpError(401, "Invalid access token");
  }
  const userId = payload.sub ?? payload.id;
  if (
    (payload.type !== undefined && payload.type !== "access") ||
    typeof userId !== "string" ||
    !userId ||
    typeof payload.exp !== "number"
  ) {
    throw createHttpError(401, "Invalid access token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw createHttpError(401, "Unauthorized");
  req.user = { id: user.id, sub: user.id };
  next();
});
