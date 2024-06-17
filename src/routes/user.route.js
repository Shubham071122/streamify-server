import { Router } from "express";
import { loginUser, registerUser,logoutUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,updateUserCoverImage, getUserChannelProfile, getWatchHistory, getUserDetailbyId,verifyPassword, forgotPassword, verifyOtp, resetPassword } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)//verify jwt is a middelware function that verify the token after they move to logoutUser method for removing access and refresh token.

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

router.route("/:userId").get(verifyJWT,getUserDetailbyId)

router.route("/verify-password").post(verifyJWT,verifyPassword)

router.route("/forget-password").post(verifyJWT,forgotPassword)

router.route("/verify-otp").post(verifyJWT,verifyOtp)

router.route("/reset-password").post(verifyJWT,resetPassword);

export default router;


