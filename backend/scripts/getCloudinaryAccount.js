const cloudinary = require('cloudinary').v2;
require('dotenv').config();

let CLOUDINARY_CLOUD_NAME='di6piyfu8'
let CLOUDINARY_API_KEY='922369985173375'
let CLOUDINARY_API_SECRET='6_fECoSBG4pAA7I0BVnJD8VzwCk'
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

cloudinary.api.ping((error, result) => {
  console.log(result);
});
