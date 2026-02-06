const express = require('express');
const router = express.Router();
const { getVendorProfile, getVendorOrders, scanQR, getVendorListings, verifyCode } = require('../controllers/vendorController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.get('/listings', protect, vendor, getVendorListings);
router.get('/profile', protect, vendor, getVendorProfile);
router.get('/orders', protect, vendor, getVendorOrders);
router.post('/scan', protect, vendor, scanQR);
router.post('/verify-code', protect, vendor, verifyCode);

module.exports = router;
