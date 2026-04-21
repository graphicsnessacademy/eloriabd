const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary with your account keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure a factory function to dynamically set sub-folders
const uploadTo = (subFolder) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `EloriaBDProject/${subFolder}`, // Dynamically inserts 'products', 'assets', etc.
      allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // basic optimization
    }
  });

  return multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });
};

module.exports = { uploadTo, cloudinary };
