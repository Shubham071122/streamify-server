import { Router } from "express";
import { loginUser, registerUser,logoutUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,updateUserCoverImage, getUserChannelProfile, getWatchHistory, getUserDetailbyId,verifyPassword, forgotPassword, resetPassword, deleteAccount } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.get('/check-auth', verifyJWT, asyncHandler(async (req, res) => {
    if(!req.user){
        return res.status(401).json({message: "Not Authenticated!"});
    }
    return res.status(200).json({
        success: true,
        user: req.user,
    });
}));

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

router.route("/:userId").get(verifyJWT,getUserDetailbyId)

router.route("/verify-password").post(verifyJWT,verifyPassword)

router.route("/delete-account").post(verifyJWT,deleteAccount)

router.route("/forgot-password").post(forgotPassword)

router.route("/reset-password/:token").post(resetPassword);

export default router;


