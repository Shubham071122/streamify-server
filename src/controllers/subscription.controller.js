import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

//************** TOGGLE SUBSCRIPTION ************* */
const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params;
    const userId = req.user._id;

    if(!channelId){
        throw new ApiError(400,"Channel Id is required");
    }
    if(!userId){
        throw new ApiError(400,"User Id is required");
    }

    try {
        //checking subscription already exists.
        const existingSubscription = await Subscription.findOne({
            subscriber:userId,
            channel:channelId
        });

        if(existingSubscription){
            //if subscription exists, remove it(unsubscribe)
            await existingSubscription.deleteOne({_id:existingSubscription._id});

            return res.status(200).json(
                new ApiResponse(200,"Unsubscribed successfully")
            )
        }
        else{
            //if subscription does not exist, create it(subscribe)
            const newSubscripton = Subscription.create({
                subscriber:userId,
                channel:channelId
            })

            return res.status(200).json(
                new ApiResponse(200,"Subscribed successfully")
            )

        }


    } catch (error) {
        console.log("Error toggling subscription: ",error);
        throw new ApiError(500, "Error toggling subscription");
    }

})


//************** SUBSCRIBER LIST OF A CHANNEL ***********/
const getUserChannelSubscribers = asyncHandler(async(req,res) => {
    const {channelId} = req.params;
    // console.log("channelId",channelId)
    if(!channelId){
        throw new ApiError(400,"Channel id is required");
    }

    try {
        const subscribers = await Subscription.find({channel:channelId})

        if(!subscribers){
            throw new ApiError(404, "Subscribers not found");
        }
        // console.log("subscribers:",subscribers)
        res.status(200).json(
            new ApiResponse(200,subscribers,"Subscriber fetched successfully")
        )

    } catch (error) {
        console.log("Error fetching subscribers: ",error);
        throw new ApiError(500,"Error fetching subscribers" )
    }
})

//************ CHANNEL LIST TO WHICH USER HAS SUBSCRIBED ********** */
const getSubscribedChannels = asyncHandler(async(req,res) => {
    const {subscriberId} = req.params;

    if(!subscriberId){
        throw new ApiError(400,"Subscriber id is required")
    }

    try {
        const subscribed_Channels = await Subscription.find({subscriber:subscriberId})

        if(!subscribed_Channels ){
            throw new ApiError(404,"Channels not Found");
        }

        res.status(200).json(
            new ApiResponse(200,subscribed_Channels ,"Channels fetched successfully")
        )

    } catch (error) {
        console.log("Error fetching channels: ",error);
        throw new ApiError(500,"Error fetching channels");
    }
})


export{toggleSubscription,getUserChannelSubscribers,getSubscribedChannels}