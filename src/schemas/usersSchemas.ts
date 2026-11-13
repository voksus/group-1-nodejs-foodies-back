import { z } from "zod";
import { registry } from "../openapi.ts";

export const UserRecipePreviewSchema = registry.register(
  "UserRecipePreview",
  z.object({
    id: z.string().openapi({ example: "clx9876543210fedcba" }),
    title: z.string().openapi({ example: "Borscht" }),
    thumb: z.string().nullable().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/borscht.jpg",
    }),
  }),
);

export const UserCardSchema = registry.register(
  "UserCard",
  z.object({
    id: z.string().openapi({ example: "clx1234567890abcdef" }),
    name: z.string().openapi({ example: "Olena Kovalenko" }),
    avatar: z.string().nullable().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    }),
    recipesCount: z.number().int().openapi({ example: 12 }),
    isFollowing: z.boolean().openapi({ example: true }),
    recipes: z.array(UserRecipePreviewSchema),
  }),
);

export const PaginatedUserCardsSchema = registry.register(
  "PaginatedUserCards",
  z.object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 5 }),
    total: z.number().int().openapi({ example: 25 }),
    totalPages: z.number().int().openapi({ example: 5 }),
    items: z.array(UserCardSchema),
  }),
);

export const CurrentUserResponseSchema = registry.register(
  "CurrentUserResponse",
  z.object({
    id: z.string().openapi({ example: "clx1234567890abcdef" }),
    name: z.string().openapi({ example: "Olena Kovalenko" }),
    email: z.string().email().openapi({ example: "olena@example.com" }),
    avatar: z.string().nullable().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    }),
    recipesCount: z.number().int().openapi({ example: 12 }),
    favoritesCount: z.number().int().openapi({ example: 8 }),
    followersCount: z.number().int().openapi({ example: 34 }),
    followingCount: z.number().int().openapi({ example: 19 }),
  }),
);

export const UserByIdResponseSchema = registry.register(
  "UserByIdResponse",
  z.object({
    id: z.string().openapi({ example: "clx1234567890abcdef" }),
    name: z.string().openapi({ example: "Olena Kovalenko" }),
    email: z.string().email().openapi({ example: "olena@example.com" }),
    avatar: z.string().nullable().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    }),
    recipesCount: z.number().int().openapi({ example: 12 }),
    followersCount: z.number().int().openapi({ example: 34 }),
    isFollowing: z.boolean().openapi({ example: true }),
  }),
);

export const AvatarResponseSchema = registry.register(
  "AvatarResponse",
  z.object({
    avatar: z.string().nullable().openapi({
      example: "https://res.cloudinary.com/demo/image/upload/new-avatar.jpg",
    }),
  }),
);
