import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';



//********************* GENERATE ACCESS AND REFRESH TOKEN: */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        console.log("Inside generate token file")
        const user = await User.findById(userId)
        console.log(user);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        console.log("Printing token")
        console.log(accessToken)
        console.log(refreshToken)

        //storing refresh token into database 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })// this line say validation check mt kro direct save kr.

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


//********************************** REGISTER ****************************
const registerUser = asyncHandler(async (req, res) => {

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
    const { fullName, email, username, password } = req.body
    console.log("email: ", email);
    // console.log(req.body)

    //*validating email:
    // hm yaha pe ek ek me if laga ke vi check kr skte h
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }


    //* checking is user existed or not:
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist");
    }


    //*check for avatar and coverimage:
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
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
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }


    //* created user object - created entry in db:
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //*removeing password and refresh token field from response:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    console.log(createdUser);


    //*checking for user creation:
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user");
    }

    //*return res:
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registerd successfully")
    )

})

//************************** LOGIN ********************
const loginUser = asyncHandler(async (req,res) => {
    //req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send secure cookies.


    //** fetching data from req body -> data
    const { email, username, password } = req.body

    //** checking username and email is passed or not */
    console.log(email);
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }
    console.log("outside if block")
    //** checking user in mongodb  */
    const user = await User.findOne({// findOne mongooes ka method h to iko sirf mongodb ke data pe hi laga skte h
        $or: [{ username }, { email }]// $or is a monogodb operator that use ot find any one is it username or email .it return
    })

    // ** crose checking is user found or not in data base
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //** password checking */
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user Credentials")
    }

    console.log(user._id);
    //** generating access and refresh token */
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


    const logedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log("Inside loginUser:\n",logedInUser)


    const options = {
        httpOnly: true,
        secure: true
        // both use for hiding the data from client side , changes only done through backend only
    }

    //** sending resoponse data to the user */
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: logedInUser, accessToken, refreshToken

                },
                "User logged in successfully"
            )
        )

})


// ****************************** LOGOUT ************************
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,// ye database se refresh token ko undefin set kr dega
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true

    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

//************ MAKING REFRESH THE ACCESS TOKEN *************** */
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET 
        )

        const user = await User.findById(decodedToken._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }

        const options ={
            httpOnly:true,
            secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }


})

export { registerUser, loginUser, logoutUser,refreshAccessToken } 