const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const FoodListing = require('../models/FoodListing');

// @desc    Get vendor listings
// @route   GET /api/vendors/listings
// @access  Private (Vendor)
const getVendorListings = async (req, res) => {
    try {
        const listings = await FoodListing.find({ vendor: req.user._id }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private (Vendor)
const getVendorProfile = async (req, res) => {
    const vendor = await Vendor.findById(req.user._id);
    if (vendor) {
        res.json(vendor);
    } else {
        res.status(404).json({ message: 'Vendor not found' });
    }
};

// @desc    Get vendor orders
// @route   GET /api/vendors/orders
// @access  Private (Vendor)
const getVendorOrders = async (req, res) => {
    try {
        const orders = await Order.find({ vendor: req.user._id })
            .populate('user', 'name phone')
            .populate('items.listing', 'title')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Scan QR and Mark Collected
// @route   POST /api/vendors/scan
// @access  Private (Vendor)
const scanQR = async (req, res) => {
    const { qrCodeData } = req.body; // Expecting Order ID

    try {
        const order = await Order.findById(qrCodeData);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Order does not belong to this vendor' });
        }

        if (order.orderStatus === 'collected') {
            return res.status(400).json({ message: 'Order already collected' });
        }

        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Order not paid yet' });
        }

        order.orderStatus = 'collected';
        await order.save();

        res.json({ message: 'Order collected successfully', order });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify Pickup Code and Mark Collected
// @route   POST /api/vendors/verify-code
// @access  Private (Vendor)
const verifyCode = async (req, res) => {
    const { pickupCode } = req.body;

    try {
        const order = await Order.findOne({ 
            pickupCode, 
            vendor: req.user._id,
            orderStatus: 'placed',
            paymentStatus: 'paid'
        });

        if (!order) {
            return res.status(404).json({ message: 'Invalid code or order already collected' });
        }

        order.orderStatus = 'collected';
        await order.save();

        res.json({ message: 'Order verified and collected successfully', order });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getVendorProfile, getVendorOrders, scanQR, getVendorListings, verifyCode };
