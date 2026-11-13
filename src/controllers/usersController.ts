import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary.ts";
import { prisma } from "../db.ts";
import { HttpError } from "../errors/HttpError.ts";
import * as userService from "../services/usersService.ts";
import { ctrlWrapper } from "../utils/ctrlWrapper.ts";

// 1. GET /api/users/current
const getCurrent = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const userProfile = await userService.getCurrentUserService(userId);
  res.json(userProfile);
};

// 2. GET /api/users/:id
const getById = async (req: Request, res: Response) => {
  const currentUserId = req.user?.sub;
  if (!currentUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = String(req.params.id);
  const userProfile = await userService.getUserByIdService(
    targetUserId,
    currentUserId,
  );
  res.json(userProfile);
};

// 3. PATCH /api/users/avatars
const changeAvatar = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!req.file) {
    throw new HttpError(400, "Avatar image file is required");
  }

  const filePath = req.file.path;

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "avatars",
      transformation: [{ width: 250, height: 250, crop: "fill" }],
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.secure_url },
    });

    res.json({ avatar: updatedUser.avatar });
  } finally {
    await fs.unlink(filePath).catch(() => null);
  }
};

// 4. GET /api/users/following
const fetchFollowing = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;

  const result = await userService.getFollowingService(userId, page, limit);
  res.json(result);
};

// 5. GET /api/users/:id/followers
const fetchFollowers = async (req: Request, res: Response) => {
  const currentUserId = req.user?.sub;
  if (!currentUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = String(req.params.id);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;

  const result = await userService.getFollowersService(
    targetUserId,
    currentUserId,
    page,
    limit,
  );
  res.json(result);
};

// 6. POST /api/users/:id/follow
const follow = async (req: Request, res: Response) => {
  const currentUserId = req.user?.sub;
  if (!currentUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = String(req.params.id);
  const result = await userService.followUserService(
    currentUserId,
    targetUserId,
  );
  res.json(result);
};

// 7. DELETE /api/users/:id/follow
const unfollow = async (req: Request, res: Response) => {
  const currentUserId = req.user?.sub;
  if (!currentUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = String(req.params.id);
  const result = await userService.unfollowUserService(
    currentUserId,
    targetUserId,
  );
  res.json(result);
};

export const getCurrentUser = ctrlWrapper(getCurrent);
export const getUserById = ctrlWrapper(getById);
export const updateAvatar = ctrlWrapper(changeAvatar);

export const getFollowing = ctrlWrapper(fetchFollowing);
export const getFollowers = ctrlWrapper(fetchFollowers);
export const followUser = ctrlWrapper(follow);
export const unfollowUser = ctrlWrapper(unfollow);
