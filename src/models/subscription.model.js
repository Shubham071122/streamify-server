import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{//This field stores the ID of the user who is subscribing to the channel.
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{//This field stores the ID of the user who is being subscribed to (the channel).
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },{
         timestamps:{
            type:String 
         }
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema)