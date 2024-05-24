import mongoose from "mongoose";
import {Like} from '../models/like.model.js'
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from "../utils/ApiResponse.js";


//************ TOGGLE VIDEO LIKE ****************** */

const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if(!videoId){
        throw new ApiError(400, "Video id required");
    }
    if(!userId){
        throw new ApiError(400, "User id required");
    }

    try{
        //checking if the user already like the video.
        const existingLike = await Like.findOne({video:videoId,likedBy: userId});

        console.log("Existing LIke: ",existingLike);

        if(existingLike){
            //user has already liked the video, so removed the like
            const existingLike_id = existingLike._id;
            await Like.deleteOne({_id:existingLike_id});
            return res.status(200).json(new ApiResponse(200,"Like removed successfully"));
        }
        else{
            //use has not like the video, so create a new like
            const newLike = await Like.create({video:videoId,likedBy: userId});

            console.log("New Like:" ,newLike);
            return res.status(200).json(new ApiResponse(200,"Video liked successfully"));
        }
    }
    catch(error){
        console.error("Error toggling video like: ",error);
        throw new ApiError(500, "Internal server Error ")
    }




})

//************ TOGGLE COMMENT LIKE ****************** */

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    const userId = req.user._id;

    if(!commentId){
        throw new ApiError(400, "Commenet id required")
    }

    if(!userId){
        throw new ApiError(400, "User id required");
    }

    try {
        //checking if the user already liked the comment
        const existingLike = await Like.findOne({comment:commentId,likedBy:userId})

        if(existingLike){
            //user has already liked the comment, so remove the like.
            const existingLike_id = existingLike._id;
            await Like.deleteOne({_id:existingLike_id});
            return res.status(200).json(new ApiResponse(200,"Like removed successfully"));
        }
        else{
            //use has not liked the comment, so create a new like.
            const newLike = await Like.create({comment:commentId,likedBy:userId});
            return res.status(200).json(new ApiResponse(200,"Commnet liked successfully"));
        }

    } catch (error) {
        console.error("Error toggling comment like: ",error);
        throw new ApiError(500, "Internal server error");
    }


    
})

//************ TOGGLE TWEET LIKE ****************** */

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    const userId = req.user._id;

    if(!tweetId){
        throw new ApiError(400, "Tweet Id required");
    }

    if(!userId){
        throw new ApiError(400, "User Id is required");
    }

    try {
        //checking if the user already liked the tweet
        const existingLike = await Like.findOne({tweet:tweetId,likedBy:userId})

        if(existingLike){
            //user has already liked the comment, so remove the like.
            const existingLike_id = existingLike._id;
            await Like.deleteOne({_id:existingLike_id});
            return res.status(200).json(new ApiResponse(200,"Like removed successfully"));

        }
        else{
             //use has not liked the comment, so create a new like.
             const newLike = await Like.create({tweet:tweetId,likedBy:userId});
            return res.status(200).json(new ApiResponse(200,"Tweet liked successfully"));
        }



    } catch (error) {
        console.error("Error toggling tweet like: ",error);
        throw new ApiError(500, "Internal server error");
    }

})

//************ GET ALL LIKED VIDEO ************** */
const getLikedVideos = asyncHandler(async(req,res) => {
    const userId = req.user._id;

    if(!userId){
        throw new ApiError(400, "User id required");
    }

    try {
        // Find all liked video by the user
        const likedVideos = await Like.find({ likedBy: userId,video:{$exists:true} })// $exists filtre if only video filed present
        .populate({path:'video',
        select: 'title description video thumbnail duration'
        });

        // console.log(likedVideos);

        return res.status(200).json(
            new ApiResponse(200,likedVideos,"Liked videos fetched successfully")
        )
    } catch (error) {
        console.log("Error fetching liked videos: ",error);
        throw new ApiError(500,"Internal server error");
    }
})

export{toggleVideoLike, toggleCommentLike,toggleTweetLike,getLikedVideos};