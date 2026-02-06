const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    getCart, 
    addToCart, 
    removeFromCart,
    deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('image'), updateUserProfile)
    .delete(protect, deleteAccount);

router.route('/cart')
    .get(protect, getCart)
    .post(protect, addToCart);

router.route('/cart/:listingId')
    .delete(protect, removeFromCart);

module.exports = router;
