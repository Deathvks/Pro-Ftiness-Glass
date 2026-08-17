import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadVideoToCloudinary = (fileBuffer, fileName, mimeType, username) => {
  return new Promise((resolve, reject) => {
    // Determine the resource type based on mime type
    // Cloudinary separates images, videos, and raw files.
    const resourceType = mimeType.startsWith('video/') ? 'video' : (mimeType.startsWith('image/') ? 'image' : 'auto');

    const folderName = `pro-fitness/${username}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: resourceType,
        public_id: fileName.split('.')[0], // Cloudinary handles extensions automatically
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error);
        }
        
        // Return standard object similar to what Google Drive returned
        resolve({
          id: result.public_id,
          webViewLink: result.secure_url,
          webContentLink: result.secure_url
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
