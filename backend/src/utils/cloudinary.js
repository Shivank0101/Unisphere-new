import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // node js file system module to handle file operations

// below is the basic configuration for cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null// check if the file path is provided or not
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }) //upload the file on cloudinary

        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)//remove the locally saved file after uplaoding it on cloudinary
        // return the response from cloudinary
        console.log(response);
        
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}