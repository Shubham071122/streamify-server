import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


//********** GET VIDEOS COMMENT ********* */
const getVideoComments = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if(!videoId){
        throw new ApiError(400, "Video id required");
    }

    try {
        const comments = await Comment.find({video: videoId})

        if(!comments){
            throw new ApiError(404, "Comment not found");
        }

        res.status(200).json(
            new ApiResponse(200,"Comment fetched successfully")
        )

        // console.log(comments);

    } catch (error) {
        console.log("Error on fetching comments: ",error);
        throw new ApiError(400, "Error on fetching comments");
    }


})

//********** ADD COMMENT ************ */
const addComment = asyncHandler(async(req,res) => {
    const {comment} = req.body;
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!comment) {
        throw new ApiError(400, "Comment content is required");
    }

    if(!videoId){
        throw new ApiError(400,"Video id required");
    }
    if(!userId){
        throw new ApiError(400,"User id required");
    }

    try{
        //creating comment in database.
        const newComment = await Comment.create({
            content:comment,
            video:videoId,
            owner:userId
        });

        console.log("Comment: ",newComment)
        
        res.status(200).json(
            new ApiResponse(200,"Comment added successfully")
        )

    }catch(error){
        console.log("Error adding comment: ",error);
        throw new ApiError(500, "Internal server error");
    }

})

//********** UPDATE COMMENT ************ */
const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    const {comment} = req.body;
    const userId = req.user._id;

    // console.log(commentId);

    if(!commentId) {
        throw new ApiError(400, "Comment Id required");
    }

    if(!comment){
        throw new ApiError(400, "New comment content required");
    }

        try {
            //find the comment by id
            const existingComment = await Comment.findById(commentId);

            if(!existingComment){
                throw new ApiError(404,"Comment not found");
            }
            
            //checking if the comment belongs to the user making the request.
            if(existingComment.owner.toString() !== userId.toString()){
                throw new ApiError(403, "You do not have permission to update this comment");
            }

            //update the comment
            const upComment = await Comment.findByIdAndUpdate(
                commentId,
                {
                    $set:{
                        content : comment,
                    }
                }
            )

            res.status(200).json(
                new ApiResponse(200,"Comment updated successfully")
            )
            
        } catch (error) {
            console.log("Error updating comment: ",error);
            throw new ApiError(500,"Internal server error");
        }

})

//********** DELETE COMMENT ************ */
const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    const userId = req.user._id;

    if(!commentId){
        throw new ApiError(400, "Comment id required");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found");
    }

    const delComment = await Comment.deleteOne({_id:commentId});

    res.status(200).json(
        new ApiResponse(200,"Comment deleted successfully")
    )


})

export{getVideoComments,addComment,updateComment,deleteComment}