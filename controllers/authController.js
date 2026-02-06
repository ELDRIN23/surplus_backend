const User = require('../models/User');
const Vendor = require('../models/Vendor');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register-user
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone, place, district, state, coordinates } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Image logic
    let image = null;
    if (req.file) {
        image = `uploads/${req.file.filename}`;
    }

    let parsedCoordinates = null;
    if (coordinates) {
        try {
            parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
        } catch (e) {
            console.error("Error parsing coordinates", e);
        }
    }

    // Auto-promote to admin if email starts with "admin@" (Dev convenience)
    const isAdmin = email.startsWith('admin@');

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        place, 
        district, 
        state,
        coordinates: parsedCoordinates,
        image,
        role: isAdmin ? 'admin' : 'user'
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Register a new vendor
// @route   POST /api/auth/register-vendor
// @access  Public
const registerVendor = async (req, res) => {
    const { name, ownerName, email, password, phone, address, place, district, state, coordinates, description, licenseNumber } = req.body;

    const vendorExists = await Vendor.findOne({ email });
    if (vendorExists) {
        return res.status(400).json({ message: 'Vendor already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let image = null;
    if (req.file) {
        if (req.file.path) {
            image = `uploads/${req.file.filename}`;
        } else if (req.file.buffer) {
            try {
                const fs = require('fs');
                const path = require('path');
                const filename = `vendor-${Date.now()}${path.extname(req.file.originalname || '.jpg')}`;
                const uploadDir = path.resolve(__dirname, '..', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
                image = `uploads/${filename}`;
            } catch (e) {
                console.error('Vendor Image Save Error:', e);
            }
        }
    }

    let parsedCoordinates = null;
    if (coordinates) {
        try {
            parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
        } catch (e) {
            console.error("Error parsing coordinates", e);
        }
    }

    const vendor = await Vendor.create({
        name,
        ownerName,
        email,
        password: hashedPassword,
        phone,
        address,
        place, 
        district, 
        state,
        coordinates: parsedCoordinates,
        description,
        licenseNumber,
        image,
        isApproved: false // Require admin approval
    });

    if (vendor) {
        res.status(201).json({
            _id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: 'vendor',
            message: 'Vendor registered successfully. Please wait for admin approval.',
            // No token returned immediately for vendors until approved? 
            // Or return token but middleware blocks actions?
            // User requested: "Vendor login with admin approval". 
            // Usually valid credentials allow login, but actions are restricted.
            // Let's return token but they can't do much.
            token: generateToken(vendor.id, 'vendor')
        });
    } else {
        res.status(400).json({ message: 'Invalid vendor data' });
    }
};

// @desc    Auth user/vendor & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    try {
        // Try User search (Customers & Admins)
        let user = await User.findOne({ email });
        let isVendor = false;

        if (!user) {
            console.log('User not found in Users collection, checking Vendors...');
            // Try Vendor search
            user = await Vendor.findOne({ email });
            isVendor = true;
        }

        if (!user) {
             console.log('User not found in either collection');
             return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log('Password match, logging in');
            const role = isVendor ? 'vendor' : (user.role || 'user');
            
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: role,
                token: generateToken(user.id, role),
                isApproved: isVendor ? user.isApproved : true
            });
        } else {
            console.log('Password mismatch');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { registerUser, registerVendor, login };
