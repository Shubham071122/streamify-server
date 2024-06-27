import { Router } from "express";
import { getVideos,getAllVideos,deleteVideo, getVideoById, getUserVideos, publishAVideo, updateVideo, togglePublishStatus,incrementViewCount,getViewCount, } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT)

router.route("/").get(getAllVideos)

router.route("/search").get(getVideos)

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

router.route("/v/:videoId").get(getVideoById) 

router.route("/update-video/:videoId").patch(upload.single("thumbnail"),updateVideo)

router.route("/user-videos").get(getUserVideos);

router.route("/delete-video/:videoId").delete(deleteVideo)

router.route("/toggle-publish-status/:videoId").patch(togglePublishStatus)

router.route("/view/:videoId").patch(incrementViewCount);
router.route("/view-count/:videoId").get(getViewCount);



export default router;