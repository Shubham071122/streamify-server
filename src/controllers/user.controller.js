import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req,res) => {

    //get user details from forntend
    //validation(email sahi se likha h ya nahi)
    //check if user already exists
    //check for images, check for avatar
    // upload them to cloudinary, avatar check from cloudinary is uploaded or not
    //create user object - create entry in db
    //remove password and refresh token field from response
    // check for user creation
    //return res

    //*getting user details:
    const {fullName,email,username,password} = req.body
    console.log("email: ",email);
    // console.log(req.body)

    //*validating email:
    // hm yaha pe ek ek me if laga ke vi check kr skte h
    if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }


    //* checking is user existed or not:
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist");
    }
    

    //*check for avatar and coverimage:
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // solving bug if user not pass coverimage.
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //*checking the avatar is uploaded on cloudinary or not:
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }


    //* created user object - created entry in db:
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })


    //*removeing password and refresh token field from response:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    
    console.log(createdUser);

    
    //*checking for user creation:
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registring the user");
    }

    //*return res:
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registerd successfully")
    )

})

export {registerUser}