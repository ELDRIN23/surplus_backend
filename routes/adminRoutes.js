const express = require('express');
const router = express.Router();
const { 
    getPendingVendors, 
    toggleVendorApproval, 
    getAllUsers, 
    getAllVendors,
    getVendorListings,
    deleteVendor,
    toggleUserStatus,
    getUserOrders,
    getAllTransactions
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/pending-vendors', protect, admin, getPendingVendors);
router.put('/vendors/:id/toggle', protect, admin, toggleVendorApproval);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/toggle', protect, admin, toggleUserStatus);
router.get('/users/:id/orders', protect, admin, getUserOrders);
router.get('/transactions', protect, admin, getAllTransactions);
router.get('/vendors', protect, admin, getAllVendors);
router.get('/vendors/:id/listings', protect, admin, getVendorListings);
router.delete('/vendors/:id', protect, admin, deleteVendor);

module.exports = router;
