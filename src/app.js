import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.get("/",(req,res) =>{
  res.send("wlcome to streamify");
})

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["POST", "GET", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookies", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" })); // form se data yaha aayega.

app.use(express.urlencoded({ extended: true, limit: "20kb" })); // yaha data url se aayega

app.use(express.static("public"));

app.use(cookieParser());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 100,
//   standardHeaders: "draft-7",
//   legacyHeaders: false,
//   message: "Too Many Requests!",
// });

// routes import

import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.router.js";
import likeRouter from "./routes/like.route.js";
import commentRouter from "./routes/comment.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import playlistRouter from "./routes/playlist.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };
