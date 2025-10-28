import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) {
            console.error('uploadOnCloudinary: No file path provided');
            return null;
        }

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.error('uploadOnCloudinary: File does not exist at path:', localFilePath);
            return null;
        }

        console.log('uploadOnCloudinary: Uploading file:', localFilePath);
        console.log('Cloudinary config:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'MISSING',
            api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING'
        });

        //upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uploaded successfully 
        console.log("File uploaded to Cloudinary successfully:", response.secure_url);
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        console.error('uploadOnCloudinary error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Clean up file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        //remove the locally saved temp file as the upload operation got failed 
        return null;
    }
}

// Upload a buffer directly to Cloudinary
const uploadBufferToCloudinary = async (buffer, filename) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', public_id: filename },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export { uploadOnCloudinary, uploadBufferToCloudinary };
