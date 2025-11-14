// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Loads .env variables

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadToCloudinary = (filePath, folder, resourceType = 'auto', customFilename = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };
    
    // Add custom filename if provided
    if (customFilename) {
      uploadOptions.public_id = customFilename;
    }
    
    cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = { cloudinary, uploadToCloudinary };
