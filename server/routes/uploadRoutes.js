const express = require('express');
const router = express.Router();
const { uploadTo, cloudinary } = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');

// Error handling middleware for Multer (Catches the 5MB limit / formats)
const handleUploadErrors = (err, req, res, next) => {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    next();
};

// POST /api/upload
// Accepts up to 4 images
router.post('/', adminAuth(), (req, res, next) => {
  const uploadMiddleware = uploadTo('products').array('images', 4);
  
  uploadMiddleware(req, res, function (err) {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        // Return the array of urls and publicIds
        const uploadedImages = req.files.map(file => ({
            url: file.path,
            publicId: file.filename
        }));

        res.status(200).json({ images: uploadedImages });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed' });
    }
});

// DELETE /api/upload
// Deletes an image by publicId
router.delete('/', adminAuth(), async (req, res) => {
    const { publicId } = req.body;
    
    if (!publicId) {
        return res.status(400).json({ message: 'publicId is required' });
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok' || result.result === 'not found') {
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            res.status(400).json({ message: 'Failed to delete image' });
        }
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Server error while deleting image' });
    }
});

module.exports = router;
