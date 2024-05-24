

import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "20kb"})) // form se data yaha aayega.

app.use(express.urlencoded({extended:true, limit:"20kb"})) // yaha data url se aayega

app.use(express.static("public"))

app.use(cookieParser())


// routes import

import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.router.js'
import likeRouter from './routes/like.route.js';


// routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/likes",likeRouter);


export{app};