const Vendor = require('../models/Vendor');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Order = require('../models/Order');

// @desc    Get all pending vendors
// @route   GET /api/admin/pending-vendors
// @access  Private (Admin)
const getPendingVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({ isApproved: false });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve/Disable vendor
// @route   PUT /api/admin/vendors/:id/toggle
// @access  Private (Admin)
const toggleVendorApproval = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (vendor) {
            vendor.isApproved = !vendor.isApproved;
            await vendor.save();
            res.json({ message: `Vendor ${vendor.isApproved ? 'approved' : 'disabled'}`, vendor });
        } else {
            res.status(404).json({ message: 'Vendor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private (Admin)
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({}).sort({ createdAt: -1 });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get listings for a specific vendor
// @route   GET /api/admin/vendors/:id/listings
// @access  Private (Admin)
const getVendorListings = async (req, res) => {
    try {
        const listings = await FoodListing.find({ vendor: req.params.id }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a vendor and all their listings
// @route   DELETE /api/admin/vendors/:id
// @access  Private (Admin)
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (vendor) {
            // Delete all listings associated with this vendor first
            await FoodListing.deleteMany({ vendor: req.params.id });
            // Delete the vendor
            await vendor.deleteOne();
            res.json({ message: 'Restaurant and all associated listings removed permanently' });
        } else {
            res.status(404).json({ message: 'Vendor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle User Block Status
// @route   PUT /api/admin/users/:id/toggle
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isBlocked = !user.isBlocked;
            await user.save();
            res.json({ message: `User account ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get orders for a specific user
// @route   GET /api/admin/users/:id/orders
// @access  Private (Admin)
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.id })
            .populate('vendor', 'name')
            .populate('items.listing', 'title')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    getPendingVendors, 
    toggleVendorApproval, 
    getAllUsers, 
    getAllVendors,
    getVendorListings,
    deleteVendor,
    toggleUserStatus,
    getUserOrders
};
