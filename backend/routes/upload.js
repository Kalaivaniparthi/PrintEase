const express = require('express');
const { upload, cloudinary } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/upload
// Students only — upload a document to Cloudinary
router.post('/', protect, authorize('student'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        // Cloudinary gives us the URL and public_id
        const fileData = {
            name:     req.file.originalname,
            url:      req.file.path,           // Cloudinary secure URL
            publicId: req.file.filename,       // Cloudinary public_id
            size:     req.file.size,
            mimeType: req.file.mimetype
        };

        res.json({ success: true, file: fileData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/upload/:publicId — remove file from Cloudinary
router.delete('/:publicId', protect, authorize('student', 'admin'), async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        res.json({ success: true, message: 'File deleted from cloud.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
