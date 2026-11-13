import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const UserPreviewRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumb: z.string().nullable(),
});

export const UserCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  recipesCount: z.number(),
  isFollowing: z.boolean(),
  recipes: z.array(UserPreviewRecipeSchema),
});

export const CurrentUserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  recipesCount: z.number(),
  favoritesCount: z.number(),
  followersCount: z.number(),
  followingCount: z.number(),
});

export const UserByIdResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  recipesCount: z.number(),
  followersCount: z.number(),
  isFollowing: z.boolean(),
});

export const PaginatedUserCardsSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  data: z.array(UserCardSchema),
});

export const AvatarResponseSchema = z.object({
  avatar: z.string().url(),
});