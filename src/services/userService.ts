import { prisma } from '../db.js';
import { HttpError } from '../errors/HttpError.js';

// 1. Отримати поточного користувача (5 показників)
export const getCurrentUserService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: {
        select: {
          recipes: true,
          favorites: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    recipesCount: user._count.recipes,
    favoritesCount: user._count.favorites,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  };
};

// 2. Отримати чужий профіль (3 показники + isFollowing)
export const getUserByIdService = async (targetUserId: string, currentUserId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: {
        select: {
          recipes: true,
          followers: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const followRecord = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    recipesCount: user._count.recipes,
    followersCount: user._count.followers,
    isFollowing: Boolean(followRecord),
  };
};

// 3. Пагінований список підписок
export const getFollowingService = async (userId: string, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;

  const [total, followingRecords] = await Promise.all([
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            name: true,
            avatar: true,
            _count: { select: { followers: true, recipes: true } },
            recipes: {
              take: 4,
              orderBy: { createdAt: 'desc' },
              select: { id: true, title: true, thumb: true },
            },
          },
        },
      },
    }),
  ]);

  const result = followingRecords.map((record) => ({
    id: record.following.id,
    name: record.following.name,
    avatar: record.following.avatar,
    recipesCount: record.following._count.recipes,
    isFollowing: true,
    recipes: record.following.recipes,
  }));

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: result,
  };
};

// 4. Пагінований список підписників
export const getFollowersService = async (targetUserId: string, currentUserId: string, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;

  const [total, followerRecords] = await Promise.all([
    prisma.follow.count({ where: { followingId: targetUserId } }),
    prisma.follow.findMany({
      where: { followingId: targetUserId },
      skip,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatar: true,
            _count: { select: { followers: true, recipes: true } },
            recipes: {
              take: 4,
              orderBy: { createdAt: 'desc' },
              select: { id: true, title: true, thumb: true },
            },
          },
        },
      },
    }),
  ]);

  const followerUserIds = followerRecords.map((r) => r.follower.id);
  const currentUserFollows = await prisma.follow.findMany({
    where: {
      followerId: currentUserId,
      followingId: { in: followerUserIds },
    },
    select: { followingId: true },
  });

  const currentUserFollowsSet = new Set(currentUserFollows.map((f) => f.followingId));

  const result = followerRecords.map((record) => ({
    id: record.follower.id,
    name: record.follower.name,
    avatar: record.follower.avatar,
    recipesCount: record.follower._count.recipes,
    isFollowing: currentUserFollowsSet.has(record.follower.id),
    recipes: record.follower.recipes,
  }));

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: result,
  };
};

// 5. Підписатися
export const followUserService = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, 'You cannot follow yourself');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new HttpError(404, 'User not found');
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
    create: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
    update: {},
  });

  return { message: 'Successfully followed' };
};

// 6. Відписатися
export const unfollowUserService = async (currentUserId: string, targetUserId: string) => {
  await prisma.follow.deleteMany({
    where: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  return { message: 'Successfully unfollowed' };
};