import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import express from "express";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance}`);

    }catch(error) {
        console.error("MONGODB Connection FAILED : ",error);
        process.exit(1);
    }
}

export default connectDB;