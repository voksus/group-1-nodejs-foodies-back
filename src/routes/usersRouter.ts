import { Router } from "express";
import "../docs/users.ts";
import * as userCtrl from "../controllers/usersController.ts";
import { authenticate } from "../middlewares/authenticate.ts";
import { upload } from "../middlewares/upload.ts";

const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/current", userCtrl.getCurrentUser);
usersRouter.get("/following", userCtrl.getFollowing);
usersRouter.patch("/avatars", upload.single("avatar"), userCtrl.updateAvatar);
usersRouter.get("/:id", userCtrl.getUserById);
usersRouter.get("/:id/followers", userCtrl.getFollowers);
usersRouter.post("/:id/follow", userCtrl.followUser);
usersRouter.delete("/:id/follow", userCtrl.unfollowUser);

export default usersRouter;
