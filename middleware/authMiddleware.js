const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user or vendor
            if (decoded.role === 'vendor') {
                 req.user = await Vendor.findById(decoded.id).select('-password');
            } else {
                 req.user = await User.findById(decoded.id).select('-password');
            }
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user/vendor not found' });
            }

            if (req.user.isBlocked) {
                return res.status(403).json({ message: 'Your account has been disabled by administrators.' });
            }

            req.user.role = decoded.role; // Ensure role is available
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const vendor = (req, res, next) => {
    if (req.user && req.user.role === 'vendor') {
         // Check if approved
         /*
         if (!req.user.isApproved) {
             return res.status(403).json({ message: 'Vendor account not approved yet.' });
         }
         */
         next();
    } else {
        res.status(401).json({ message: 'Not authorized as a vendor' });
    }
};


module.exports = { protect, admin, vendor };
