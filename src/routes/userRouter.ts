import { Router } from 'express';
import { registry } from '../openapi.js';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/upload.js';
import * as userCtrl from '../controllers/userController.js';
import {
  CurrentUserResponseSchema,
  UserByIdResponseSchema,
  AvatarResponseSchema,
  PaginatedUserCardsSchema,
} from '../validations/usersSchemas.js';

// export const registry = new OpenAPIRegistry();
const userRouter = Router();

// Захищаємо всі маршрути користувача авторизацією
userRouter.use(authenticate);

// --- GET /api/users/current ---
registry.registerPath({
  method: 'get',
  path: '/api/users/current',
  summary: 'Отримати профіль поточного користувача',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Інформація про поточного користувача',
      content: { 'application/json': { schema: CurrentUserResponseSchema } },
    },
  },
});
userRouter.get('/current', userCtrl.getCurrentUser);

// --- GET /api/users/following ---
registry.registerPath({
  method: 'get',
  path: '/api/users/following',
  summary: 'Список користувачів, на яких підписаний поточний юзер',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Пагінований список підписок',
      content: { 'application/json': { schema: PaginatedUserCardsSchema } },
    },
  },
});
userRouter.get('/following', userCtrl.getFollowing);

// --- PATCH /api/users/avatars ---
registry.registerPath({
  method: 'patch',
  path: '/api/users/avatars',
  summary: 'Оновити аватар користувача',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: { avatar: { type: 'string', format: 'binary' } },
            required: ['avatar'],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Нове посилання на аватар',
      content: { 'application/json': { schema: AvatarResponseSchema } },
    },
  },
});
userRouter.patch('/avatars', upload.single('avatar'), userCtrl.updateAvatar);

// --- GET /api/users/:id ---
registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  summary: 'Отримати профіль іншого користувача',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Публічний профіль користувача',
      content: { 'application/json': { schema: UserByIdResponseSchema } },
    },
  },
});
userRouter.get('/:id', userCtrl.getUserById);

// --- GET /api/users/:id/followers ---
registry.registerPath({
  method: 'get',
  path: '/api/users/{id}/followers',
  summary: 'Отримати список підписників користувача',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Пагінований список підписників',
      content: { 'application/json': { schema: PaginatedUserCardsSchema } },
    },
  },
});
userRouter.get('/:id/followers', userCtrl.getFollowers);

// --- POST /api/users/:id/follow ---
registry.registerPath({
  method: 'post',
  path: '/api/users/{id}/follow',
  summary: 'Підписатися на користувача',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Успішно підписано' },
    400: { description: 'Спроба підписатися на самого себе' },
  },
});
userRouter.post('/:id/follow', userCtrl.followUser);

// --- DELETE /api/users/:id/follow ---
registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}/follow',
  summary: 'Відписатися від користувача',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Успішно відписано' },
  },
});
userRouter.delete('/:id/follow', userCtrl.unfollowUser);

export default userRouter;