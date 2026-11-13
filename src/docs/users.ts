import { z } from "zod";
import { PaginationQuerySchema, registry } from "../openapi.ts";
import {
  AvatarResponseSchema,
  CurrentUserResponseSchema,
  PaginatedUserCardsSchema,
  UserByIdResponseSchema,
} from "../schemas/usersSchemas.ts";
import { errorResponses } from "./errorResponses.ts";

const authSecurity: Record<string, string[]>[] = [
  { bearerAuth: [] },
  { cookieAuth: [] },
];

const UserIdParamsSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890abcdef" }),
});

registry.registerPath({
  method: "get",
  path: "/api/users/current",
  tags: ["Users"],
  summary: "Get current user profile",
  description:
    "Returns full profile details for the currently authenticated user, including email, avatar URL, and counts of created recipes, favorite recipes, followers, and following users.",
  security: authSecurity,
  responses: {
    200: {
      description: "Authenticated user profile details.",
      content: { "application/json": { schema: CurrentUserResponseSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/following",
  tags: ["Users"],
  summary: "Get users followed by the current user",
  description:
    "Returns a paginated list of users that the currently authenticated user is following, including their recipe counts and preview thumbnails.",
  security: authSecurity,
  request: { query: PaginationQuerySchema },
  responses: {
    200: {
      description: "A paginated list of followed user cards.",
      content: { "application/json": { schema: PaginatedUserCardsSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/avatars",
  tags: ["Users"],
  summary: "Update current user avatar",
  description:
    "Uploads a new avatar image file (multipart/form-data under the 'avatar' field) to Cloudinary, updates the user profile, and returns the new avatar URL.",
  security: authSecurity,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              avatar: { type: "string", format: "binary" },
            },
            required: ["avatar"],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Avatar updated successfully.",
      content: { "application/json": { schema: AvatarResponseSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  tags: ["Users"],
  summary: "Get public user profile by ID",
  description:
    "Returns public profile information for a specific user by ID, including name, email, avatar URL, and counts of added recipes and followers.",
  security: authSecurity,
  request: { params: UserIdParamsSchema },
  responses: {
    200: {
      description: "Public user profile details.",
      content: { "application/json": { schema: UserByIdResponseSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{id}/followers",
  tags: ["Users"],
  summary: "Get followers of a user",
  description:
    "Returns a paginated list of users who follow the user specified by ID, including their recipe counts and preview thumbnails.",
  security: authSecurity,
  request: {
    params: UserIdParamsSchema,
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      description: "A paginated list of follower user cards.",
      content: { "application/json": { schema: PaginatedUserCardsSchema } },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/users/{id}/follow",
  tags: ["Users"],
  summary: "Follow a user",
  description:
    "Subscribes the currently authenticated user to the target user specified by ID. Users cannot follow themselves.",
  security: authSecurity,
  request: { params: UserIdParamsSchema },
  responses: {
    200: {
      description: "Successfully followed the user.",
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Successfully followed user" }),
          }),
        },
      },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/users/{id}/follow",
  tags: ["Users"],
  summary: "Unfollow a user",
  description:
    "Removes the subscription of the currently authenticated user from the target user specified by ID.",
  security: authSecurity,
  request: { params: UserIdParamsSchema },
  responses: {
    200: {
      description: "Successfully unfollowed the user.",
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Successfully unfollowed user" }),
          }),
        },
      },
    },
    ...errorResponses,
  },
});
