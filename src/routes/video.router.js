import { Router } from "express";
import { getVideos,getAllVideos,deleteVideo, getVideoById, publishAVideo, updateVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT)

router.route("/").get(getAllVideos)

router.route("/q/:query").get(getVideos)

router.route("/publish").post(upload.fields([
    {
        name:"video",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1,
    }
]),publishAVideo)

router.route("/:videoId").get(getVideoById) 

router.route("/update-video/:videoId").patch(upload.single("thumbnail"),updateVideo)

router.route("/delete-video/:videoId").delete(deleteVideo)

router.route("/toggle-publish-status/:videoId").patch(togglePublishStatus)



export default router;