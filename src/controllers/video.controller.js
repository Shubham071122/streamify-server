import mongoose from "mongoose";
import { Video } from '../models/video.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/Cloudinary.js";
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

//************ FETCHING ALL VIDEO ******************* */
const getAllVideos = asyncHandler(async(req,res) => {
    const {page = 1, limit = 10, query,sortBy = 'createdAt', sortType='desc', userId} = req.query;

    // console.log(query);

    const filter = {};
    if(query){
        filter.$or = [
            {
                title:{
                    $regex: query, 
                    $options:'i'
                }
            },
            {
                description:{
                    $regex:query,
                    $options:'i'
                }
            }
        ]
    }

    if(userId){
        filter._id = userId;
    }


    // console.log(filter);

    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;

    try {
        const videos = await Video.find(filter) || await Video.findById(filter)
        .sort(sortOptions)
        .skip((page-1) * limit) // this will skip the number of item according to page [if userpass page 3 then (3-1)*10 = 20 we have to skip 20 item to go to the 3rd page]
        .limit(parseInt(limit));
    
            // console.log(videos);
    
        const totalVideos = await Video.countDocuments(filter);
        const totalPages = Math.ceil(totalVideos/limit);
    
        res.status(200).json(
            new ApiResponse(200,"Video fetched successfully",
            {
                videos,
                totalPages,
                totalVideos,
                currentPage: parseInt(page)
            })
        )
    } catch (error) {
        throw new ApiError(404,"Video not found!")
    }

})

//************  PUBLISHING VIDEO *********** */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // check if file is included in the request
    console.log(req.files);

    const videoLocalPath = req.files?.video[0]?.path

    console.log("Videolocalpath:", videoLocalPath)

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }


    // Calculate the duration of the video
    const videoDurationInSeconds = await calculateVideoDuration(videoLocalPath);

    console.log("VID:", videoDurationInSeconds)

    if (!videoDurationInSeconds) {
        throw new ApiError(400, "Error while geting duration")
    }

    //upload the video on cludinary
    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // checking video uploded on cloudinary or not
    if (!video) {
        throw new ApiError(400, "Failed to upload video")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Failed to upload thumbnail")
    }


    //creating a new video entry in the database
    const newVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: video.url,
        duration: videoDurationInSeconds
    })

    console.log(newVideo);

    // sending response to client
    res.status(201).json(
        new ApiResponse(200, "Video published successfully")
    )

})

//********* FETCHING VIDEO VIA ID ********** */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }


    // Fetching video from database
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    res.status(200).json(
        new ApiResponse(200, video)
    )
})

//********* UPDATING VIDEO *********** */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;


    //checking for video id
    if (!videoId) {
        throw new ApiError(400, "Video Id required!")
    }

    //checking video in databse
    let video = await Video.findById(videoId);

    //check if video exist
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    //checking title and description
    if (!title) {
        throw new ApiError(400, "Title is required")
    }

    if (!description) {
        throw new ApiError(400, "Description is required")
    }

    
    //checking new thumbnail provided or not
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }
    //upload on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    //check if thumbnail upload successfully
    if (!thumbnail) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }


    //update in database
    const videoUpdate = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnail.url
            }
        }, {
        new: true
    })

    const videoData = await Video.findById(video._id)
    console.log(videoData)

    res.status(200).json(
        new ApiResponse(200, "Video updated successfully")
    )

})

//************* DELETE VIDEO ************ */
const deleteVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "Video Id required");
    }
    console.log(videoId);

    // Finding video from database.
    const video = await Video.findById(videoId);
    console.log(video);
    if(!video){
        throw new ApiError(400,"Video not found");
    }

    //Seting url inside varibale.
    const videoUrl = video.videoFile;
    const thumbnailUrl = video.thumbnail;

    //deleting from database
    const delVideo = await Video.deleteOne({_id:videoId});

    // Deleting from Cloudinary
    try {
        if (videoUrl) {
            await deleteFromCloudinary(videoUrl,'video');
            console.log(`Deleted video file from Cloudinary: ${videoUrl}`);
        }
        if (thumbnailUrl) {
            await deleteFromCloudinary(thumbnailUrl,"image");
            console.log(`Deleted thumbnail from Cloudinary: ${thumbnailUrl}`);
        }
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw new ApiError(500, "Error deleting video from Cloudinary");
    }

    console.log("Deleted video:",delVideo);

    res.status(200).json (new ApiResponse(200,"Video deleted successfully"));


})

//*********** TOGGLE IS PUBLISHED ************* */
const togglePublishStatus  = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "Video id required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }
    

    video.isPublished = !video.isPublished;

    await video.save();

    res.status(200).json(
        new ApiResponse(200, "Publish staus toggled successfully",video.isPublished)
    )
})


export {getAllVideos, publishAVideo, getVideoById, updateVideo,deleteVideo,togglePublishStatus  }

