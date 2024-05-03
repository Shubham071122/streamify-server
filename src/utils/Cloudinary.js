import {v2 as cloudinary} from "cloudinary"
import exp from "constants";
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY, 
});


const uploadOnCloudinary = async (localFilePath) => {
  try{
    if(!localFilePath) return null
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type:"auto"
    })
    //file has been uploaded successfull
    // console.log("file is uploaded on cloudniary", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  }catch(error){
    fs.unlinkSync(localFilePath)//remove ths locally saved temporary file on own server, as the upload operation got failed
    return null;
  }
}

export{uploadOnCloudinary}