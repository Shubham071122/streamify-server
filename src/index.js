// 1.*** FIRST APPROCH
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app = express()


// WE USE  IIFE (Immediately Invoked Function Expression) TO CONNECT WITH DATABASE. 
/*    (async () => {
        try {
            mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("ERROR: ", error);
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`App is listening on port ${process.env.PORT}`)
            })

        } catch (error) {
            console.error("ERROR: ", error)
            throw error
        }
    })()
*/

// 2. SECOND APPROCH IS MAKE A SEPERATE FOLDEER FOR DATABSEE CONNECTION IN DB FOLDER

import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'

// require('dotenv').config({path:'./.env'}) //this also work but the consistency ko kharab kr rah so .

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  server is running at port : ${process.env.PORT} `)
    })
})
.catch((err) => {
    console.log("Mongodb connection faild !!! ",err);
})

// to use this dotenv we have to change some experiment in script in package.json file
//  -> nodemon -r dotenv/config --experimental-json-modules