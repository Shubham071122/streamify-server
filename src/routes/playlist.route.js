import mongoose from "mongoose";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist,getPlaylistById,getUserPlaylists, removeVideoFromPlaylist,deletePlaylist, updatePlaylist } from "../controllers/playlist.contoller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(getUserPlaylists)

router.route("/:playlistId")
    .get(getPlaylistById)
    .delete(deletePlaylist)
    .patch(updatePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

export default router;