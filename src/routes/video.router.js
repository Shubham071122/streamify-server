import { Router } from "express";
import { publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middelware.js";

const router = Router()

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

// router.route("/:videoId").patch(upload.single())



export default router;