import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

//******** CREATING PLAYLIST ************** */
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, videoId } = req.body
    const userId = req.user._id;

    console.log(req.body);

    console.log("Videoid: ", videoId);
    console.log(name)
    console.log(description);

    if (!(name || description)) {
        throw new ApiError(400, "Name and description are required");
    }

    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    try {
        const playlist = await Playlist.create({
            name,
            description,
            video: videoId,
            owner: userId
        })

        console.log(playlist);

        res.status(200).json(
            new ApiResponse(200, playlist, "Playlist created successfully")
        )

    } catch (error) {
        console.log("Error on creating playlist: ", error)
        throw new ApiError(500, "Error creating playlist");
    }


})

//******** GET USER PLAYLIST ************** */
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "User id is required");
    }


    const userPlaylist = await Playlist.find({ owner: userId })

    if (!userPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(
        new ApiResponse(200, userPlaylist, "Fetching user playlist  successfully")
    )


})

//******** UPDATE PLAYLIST ************** */
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    console.log(req.body);

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }

    if (!(name || description)) {
        throw new ApiError(400, "Name or description are required");
    }


    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId },//filter
        {
            $set: {
                name,
                description
            }
        },//update
        {
            new: true//ensures that the updated document is returned.
        }
    )

    res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )


})

//******** GET PLAYLIST ID ************** */
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }

    const playlist = await Playlist.find({ _id: playlistId })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )


})

//******** ADDING VIDEO TO PLAYLIST ************** */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }



    //finding the playlist 
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //check if the video is already in the playlist
    if (!playlist.video.includes(videoId)) {
        //add the video to the playlist
        playlist.video.push(videoId);
        await playlist.save();

        return res.status(200).json(
            new ApiResponse(200, playlist, "Video added to playlist successfully")
        )
    }
    else {
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video is already in the playlist")
        )
    }


})

//******** REMOVING VIDEO FROM PLAYLIST ************** */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }


    //finding the playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    console.log("Old playlist: ", playlist);

    //finding the index of video in playlist
    const videoIndex = playlist.video.indexOf(videoId);

    if (videoIndex > -1) {

        playlist.video.splice(videoIndex, 1);
        await playlist.save();

        console.log("New Playlist: ", playlist);
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video removed successfully")
        )
    }
    else {
        return res.status(200).json(
            new ApiError(404, null, "Video not found in playlist"))
    }



})

//******** DELETE PLAYLIST ************** */
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    await Playlist.deleteOne({ _id: playlistId })

    return res.status(200).json(
        new ApiResponse(200, "Playlist deleted successfully")
    )

})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }