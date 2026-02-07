const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User)
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: user.role,
            cart: user.cart,
            favorites: user.favorites
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (User)
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.email = req.body.email || user.email; // Allow email edit
        
        if (req.body.password) {
             const salt = await bcrypt.genSalt(10);
             user.password = await bcrypt.hash(req.body.password, salt);
        }

        if (req.file) {
            user.image = req.file.path; // Cloudinary URL
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            image: updatedUser.image,
            role: updatedUser.role,
            token: req.headers.authorization.split(' ')[1] 
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Delete Account
// @route   DELETE /api/users/profile
// @access  Private (User)
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'Account permanently deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get User Cart
// @route   GET /api/users/cart
// @access  Private (User)
const getCart = async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart.listingId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Filter out invalid/null listings (if deleted)
    const validCart = user.cart.filter(item => item.listingId !== null);
    res.json(validCart);
};

// @desc    Add to Cart
// @route   POST /api/users/cart
// @access  Private (User)
const addToCart = async (req, res) => {
    const { listingId, quantity } = req.body;
    const user = await User.findById(req.user._id);
    const listing = await FoodListing.findById(listingId);

    if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
    }

    const itemExists = user.cart.find(x => x.listingId.toString() === listingId);

    if (itemExists) {
        itemExists.quantity += Number(quantity);
    } else {
        user.cart.push({ listingId, quantity: Number(quantity) });
    }

    await user.save();
    res.json(user.cart);
};

// @desc    Remove from Cart
// @route   DELETE /api/users/cart/:listingId
// @access  Private (User)
const removeFromCart = async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(x => x.listingId.toString() !== req.params.listingId);
    await user.save();
    res.json(user.cart);
};

module.exports = { 
    getUserProfile, 
    updateUserProfile, 
    getCart, 
    addToCart, 
    removeFromCart, 
    deleteAccount 
};
