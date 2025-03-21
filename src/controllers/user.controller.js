import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import { getExpiryDate } from "../../helper/getExpiryDate.js";

//********************* GENERATE ACCESS AND REFRESH TOKEN: ***************************/
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // console.log("Inside generate token file")
    const user = await User.findById(userId);
    console.log(user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log("Printing token")
    // console.log(accessToken)
    // console.log(refreshToken)

    //storing refresh token into database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // this line say validation check mt kro direct save kr.

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

//********************************** REGISTER ****************************

const registerUser = asyncHandler(async (req, res) => {
  try {
    console.log("REQ.FILES USER:", req.files);

    const { fullName, email, username, password } = req.body;
    if ([fullName, email, username, password].some(field => !field || field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    if (!req.files?.avatar?.[0]?.path) {
      throw new ApiError(400, "Avatar file is required");
    }

    // ✅ Normalize file paths
    const avatarLocalPath = path.resolve(req.files.avatar[0].path);
    let coverImageLocalPath = req.files?.coverImage?.[0]?.path ? path.resolve(req.files.coverImage[0].path) : null;

    let avatar, coverImage;
    try {
      avatar = await uploadOnCloudinary(avatarLocalPath);
      if (!avatar) throw new Error("Avatar upload failed");

      // ✅ Check before deleting
      if (fs.existsSync(avatarLocalPath)) {
        fs.unlinkSync(avatarLocalPath);
      }

      if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage) throw new Error("Cover image upload failed");

        if (fs.existsSync(coverImageLocalPath)) {
          fs.unlinkSync(coverImageLocalPath);
        }
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new ApiError(500, "File upload failed");
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase().trim(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("Register User Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
});

//************************** LOGIN ********************
const loginUser = asyncHandler(async (req, res) => {
  // console.log(req.body);
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  console.log("outside if block");
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //** password checking */
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  console.log(user._id);
  //** generating access and refresh token */
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  console.log("accesstoken:", accessToken);
  console.log("refreshtoken:", refreshToken);

  user.refreshToken = refreshToken;
  await user.save();

  const logedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("Inside loginUser:\n", logedInUser);

  const accessTokenExpiryDate = getExpiryDate(process.env.ACCESS_TOKEN_EXPIRY);

  const options = {
    httpOnly: true,
    secure: process.env.MODE === "production", // Should be a boolean
    sameSite: process.env.MODE === "production" ? "None" : "Lax", // Adjusted for security
    expires: accessTokenExpiryDate,
  };

  //** sending resoponse data to the user */
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: logedInUser,
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

// ****************************** LOGOUT ************************
const logoutUser = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } }, // Setting it to an empty string
    { new: true }
  );

  // Cookie options
  const options = {
    httpOnly: true,
    secure: process.env.MODE === "production", // Ensure HTTPS in production
    sameSite: process.env.MODE === "production" ? "None" : "Lax", 
    expires: new Date(Date.now() - 1000 * 60 * 60),
  };

  return res
    .status(200)
    .clearCookie("accessToken", options) // Clear accessToken
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//************ MAKING REFRESH THE ACCESS TOKEN *************** */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  console.log("incRfTkn:", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "None",
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//********** CHANGING PASSWORD ******* */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//********** FETCHING CURRENT USER *************** */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

//************ UPDATING THE USER ACCOUNT *********** */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  console.log("REquset data:", req.body);

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName: fullName,
          email: email,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    // Handle unexpected errors
    throw new ApiError(500, "An error occurred while updating account details");
  }
});

//************ UPDATING AVATAR *********** */
const updateUserAvatar = asyncHandler(async (req, res) => {
  console.log("REQ FILE IN UA: ",req.file);
  try {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) throw new Error("Avatar upload failed"); 

    if (fs.existsSync(avatarLocalPath)) {
      fs.unlinkSync(avatarLocalPath);
    }

    if (!avatar || !avatar.url) {
      throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: avatar.url } },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image updated successfully"));
  } catch (error) {
    console.error("Avatar Update Error:", error);
    throw new ApiError(500, "Something went wrong while updating avatar");
  }
});

// ************ UPDATING COVER IMAGE ***********
const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) throw new Error("Avatar upload failed"); 

    if (fs.existsSync(coverImageLocalPath)) {
      fs.unlinkSync(coverImageLocalPath);
    }

    if (!coverImage || !coverImage.url) {
      throw new ApiError(400, "Error while uploading cover image to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { coverImage: coverImage.url } },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfully"));
  } catch (error) {
    console.error("Cover Image Update Error:", error);
    throw new ApiError(500, "Something went wrong while updating cover image");
  }
});

//***************** USER CHANNEL PROFILE (AGGREGATION PIPELINE) ****************** */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    // aggregate pipeline leta h
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
      // subscribers count krne ke liye hm channel count kr lenge data base se.
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            // ye condition laga ke hm check karenge ki channel subscribed h ya nahi.
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // SEND KEREGA FRONTEND ME
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1, //user jo channel subscribe kra h.
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

//*************** USER WATCH HISTORY (AGGREGATION PIPLINE) **************** */
// HAM ISME NESTED LOOKUP USE KARENGE.

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id: user._id // this will not work bcz yaha pe mongoose kam nahi krta h direct code jata h.
        _id: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // video ke owner ko retrive kr rahe h
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].getWatchHistory,
        "Watch History fetched successfully"
      )
    );
});

//************************ GET USER DATA BY ID ************************** */
const getUserDetailbyId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw ApiError(400, "User id is required");
  }
  try {
    const user = await User.findById(userId).select("avatar fullName");
    if (!user) {
      throw ApiError(404, "User not found");
    }
    // console.log("User by id:",user);
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User Fetched successfully"));
  } catch (error) {
    console.log("Error while fetching user:", error);
    throw ApiError(500, "Error while fetching user");
  }
});

//********************* VERIFING PASSWORD ******************* */
const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  res.status(200).json(new ApiResponse(200, "Password is correct"));
});

//***********  FORGET PASSWORD  ************ */

//Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate a unique JWT token for the user that contains the user's id
    const token = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Reset Password",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 2.2;">
      <h1 style="color: #333;">Reset Your Password</h1>
      <p>Click on the following link to reset your password:</p>
      <a href="${process.env.CLIENT_URL}/reset-password/${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>The link will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <a href="${process.env.CLIENT_URL}" style="color: black;line-height: 3; text-decoration: none;">www.stremify.com</a
      </div>
    `,
    };

    //Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        throw new ApiError(500, err.message, "Error while sending mail!");
      }

      return res.status(200).json(new ApiResponse(200, "Email sent"));
    });
  } catch (error) {
    console.log("Error while sending email:", error);
    throw new ApiError(500, "Server error");
  }
});

//Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  try {
    // Verify the token sent by the user
    const decodedToken = jwt.verify(
      req.params.token,
      process.env.ACCESS_TOKEN_SECRET
    );
    //Chekcing token
    if (!decodedToken) {
      throw new ApiError(400, "Invalid token!");
    }
    // Find the user with the id from the token
    const user = await User.findOne({ _id: decodedToken._id });
    if (!user) {
      throw new ApiError(404, "User not found!");
    }
    //Hash the new password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, "Password updated successfully!"));
  } catch (error) {
    console.log("Error while reseting the password:", error);
    throw new ApiError(500, "Server Error");
  }
});

//**************  DELETE ACCOUNT  ****************** */
const deleteAccount = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required!");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Account not found!");
  }

  const delUser = await User.deleteOne({ _id: user._id });

  console.log("Del user:", delUser);

  return res
    .status(200)
    .json(new ApiResponse(200, "Account delted successfully!"));
});

export {
  changeCurrentPassword,
  deleteAccount,
  forgotPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserDetailbyId,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  verifyPassword,
};
