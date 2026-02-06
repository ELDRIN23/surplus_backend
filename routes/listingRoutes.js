const express = require('express');
const router = express.Router();
const { getListings, getListingById, createListing, deleteListing, updateListing } = require('../controllers/listingController');
const { protect, vendor } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(getListings)
    .post(protect, vendor, (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                console.error('MULTER ERROR:', err);
                return res.status(400).json({ message: 'Image upload failed', error: err.message });
            }
            next();
        });
    }, createListing);

router.route('/:id')
    .get(getListingById)
    .delete(protect, vendor, deleteListing)
    .put(protect, vendor, (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) return res.status(400).json({ message: 'Upload failed' });
            next();
        });
    }, updateListing);

module.exports = router;
