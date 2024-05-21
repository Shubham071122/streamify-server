import mongoose from "mongoose";
import { Video } from '../models/video.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { exec } from 'child_process'; 

//********** */ Function to calculate the duration of a video file using FFmpeg ***************

function calculateVideoDuration(videoLocalPath) {
    return new Promise((resolve, reject) => {
        // Run FFmpeg command to get the duration of the video
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoLocalPath}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                // Parse the duration value from the output
                const videoDurationInSeconds = parseFloat(stdout);
                resolve(videoDurationInSeconds);
            }
        });
    });
}

// const getAllVideos = asyncHandler(async(req,res) => {
//     const {page = 1, limit = 10, query, sortType, userId} = req.query

// })

//************  PUBLISHIGN VIDEO *********** */
const publishAVideo = asyncHandler(async(req, res) => {
    const {title, description} = req.body

    // check if file is included in the request
    console.log(req.files);

    const videoLocalPath = req.files?.video[0]?.path

    console.log("Videolocalpath:",videoLocalPath)

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    
     // Calculate the duration of the video
     const videoDurationInSeconds = await calculateVideoDuration(videoLocalPath);

     console.log("VID:",videoDurationInSeconds)

     if(!videoDurationInSeconds){
        throw new ApiError(400,"Error while geting duration")
     }

    //upload the video on cludinary
    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // checking video uploded on cloudinary or not
    if(!video){
        throw new ApiError(400, "Failed to upload video")
    }
    if(!thumbnail){
        throw new ApiError(400, "Failed to upload thumbnail")
    }


    //creating a new video entry in the database
    const newVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: video.url,
        duration:videoDurationInSeconds
    })

    // sending response to client
    res.status(201).json(
        new ApiResponse(200,"Video published successfully")
    )

})

//********* FETCHING VIDEO VIA ID ********** */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
            throw new ApiError(400,"Video ID is required")}


    // Fetching video from database
    const video = await Video.findById(videoId);

    if(!video){
            throw new ApiError(404,"Video not found")}

    res.status(200).json(
        new ApiResponse(200,video)
    )
})

//********* UPDATING VIDEO *********** */
const updateVideo = asyncHandler(async(req,res)=> {
    const {videoId} = req.params
    const {title, description} = req.body;

    //checking for video id
    if(!videoId){
        throw new ApiError(400, "Video Id required!")
    }

    //checking video in databse
    let video = await Video.findById(videoId);

    //check if video exist
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    //updating title and description
    const updateFields = {};
    if(title) updateFields.title = title;
    if(description) updateFields.description = description;

    //checking new thumbnail provided or not
    if(req.files && req.files.thumbnail){
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
        if(!thumbnailLocalPath){
            throw new ApiError(400,"Thumbnail is required");
        }
        //upload on cloudinary
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        //check if thumbnail upload successfully
        if(!thumbnail){
            throw new ApiError(400, "Failed to upload thumbnail");
        }

        updateFields.thumbnail = thumbnail.url;

        //update in database
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title:updateFields.title,
                    description:updateFields.description,
                    thumbnail:updateFields.thumbnail
                }
            },{
                new:true
            })

    }

    res.status(200).json(
        new ApiResponse(200,"Video updated successfully")
    )
     
})



export {publishAVideo,getVideoById,updateVideo}

