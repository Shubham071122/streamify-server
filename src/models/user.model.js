import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const userSchema = new Schema(
    {
        username: {
            type:String,
            required:true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type:String,
            required:true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type:String,
            required:true,
            trim: true,
            index: true,
        },
        avatar: {
            type:String,// we use cloudinary url for image.
            required:true,
        },
        coverImage:{
            type:String,// we use cloudinary url for image.
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type:String,// this is challenge to handele.
            required: [true, 'Password is required']

        },
        refreshToken:{
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


// this is mongoose method that use to check is password correct or not.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}


export const User = mongoose.model("User",userSchema)