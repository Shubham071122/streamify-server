import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

//********* GETING CHANNEL STATS ********** */
const getChannelStats = asyncHandler(async(req,res) => {
    const userId = req.user._id;
    
    try {
        //get total videos
        const totalVideos = await Video.countDocuments({owner:userId});
    
        //get total video views
        const totalVideoViews = await Video.aggregate([
            {$match:{owner:userId}},
            {$group:{_id:null,totalViews:{$sum:'$views'}}}
        ]);
    
        const totalViews = totalVideoViews[0]?.totalViews || 0;
    
        //get total number of subscribers
        const totalSubscribers = await Subscription.countDocuments({channel:userId});
    
        //get total likes on all videos
        const totalLikes = await Like.countDocuments({Video:{$in:await Video.find({owner:userId}).select('_id')}});
    
        res.status(200).json(
            new ApiResponse(200,{
                totalLikes,
                totalSubscribers,
                totalVideos,
                totalViews
            },"Channel stats fetched successfully")
        )
    } catch (error) {
        console.log("Error fetching channel stats: ",error);
        throw new ApiError(500,"Error fetching channel stats")
    }

    
})

//************ GET ALL VIDEOS BY THE CHANNEL **********/
const getChannelVideos = asyncHandler(async(req,res) => {
    const userId = req.user._id;

    const videos = await Video.find({owner:userId});
    console.log(videos);

    if(!videos || videos.length === 0){
        throw new ApiError(404, "No videos found for this channel");
    }

    res.status(200).json(
        new ApiResponse(200,videos,"Videos fetched successfully")
    )

})


export{getChannelStats,getChannelVideos};