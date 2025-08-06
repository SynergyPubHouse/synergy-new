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
const uploadToCloudinary = (filePath, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = { cloudinary, uploadToCloudinary };
