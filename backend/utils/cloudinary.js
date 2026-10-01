import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//upload image to cloudinary
export async function uploadToCloudinary(filePath, folder = "doctors") {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "image",
        });

        // remove the local file after uploading to cloudinary
        fs.unlinkSync(filePath); 
        return result;
    } catch (err) {
        console.error("Error uploading image to Cloudinary:", err);
        throw err;
    }
}

// to delete an image that is present in cloudinary if user remove form UI
 export async function deleteFromCloudinary(publicId) { 
    try {
       if (!publicId) return;
       await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
        throw err;
    }
}

export default cloudinary;