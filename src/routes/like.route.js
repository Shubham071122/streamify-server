import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos } from "../controllers/like.controller.js";

const router = Router();
router.use(verifyJWT);// this will authenticate the route.

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/liked-videos").get(getLikedVideos)

export default router;