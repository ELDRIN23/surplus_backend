const FoodListing = require('../models/FoodListing');
const Vendor = require('../models/Vendor');

// @desc    Get all active listings
// @route   GET /api/listings?category=Meals
// @access  Public
const getListings = async (req, res) => {
    try {
        const currentTime = new Date();
        const { category } = req.query;
        
        // 1. Auto-update statuses
        await FoodListing.updateMany(
            { status: 'active', pickupEnd: { $lt: currentTime } },
            { $set: { status: 'expired' } }
        );
        await FoodListing.updateMany(
            { status: 'active', remainingQuantity: { $lte: 0 } },
            { $set: { status: 'sold_out' } }
        );

        // 2. Fetch all enabled (approved) vendors
        const vendors = await Vendor.find({ isApproved: true }).select('name address rating image');
        
        // 3. Get latest listings for these vendors (priority: active > sold_out)
        const allResults = [];
        
        for (const vendor of vendors) {
            const filter = { 
                vendor: vendor._id,
                status: { $in: ['active', 'sold_out'] },
                pickupEnd: { $gt: currentTime }
            };
            
            if (category && category !== 'All') {
                filter.category = category;
            }

            const latestListing = await FoodListing.findOne(filter)
                .populate('vendor', 'name address rating')
                .sort({ status: 1, createdAt: -1 });

            if (latestListing) {
                allResults.push(latestListing);
            } else {
                // If vendor has no current listing, create a "Sold Out" placeholder
                // but only if NO category filter is applied, or if we want them to show in a category?
                // For now, only show placeholders in "All" view to keep it clean, 
                // or if the vendor is generally associated with that category.
                if (!category || category === 'All') {
                    allResults.push({
                        _id: `temp-${vendor._id}`,
                        vendor: vendor,
                        title: 'Fresh Mystery Bag',
                        status: 'sold_out',
                        remainingQuantity: 0,
                        originalPrice: 0,
                        discountedPrice: 0,
                        pickupStart: currentTime,
                        pickupEnd: currentTime,
                        isPlaceholder: true
                    });
                }
            }
        }

        // Sort: Active first, then Sold Out
        const sortedResults = allResults.sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return 0;
        });

        res.json(sortedResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id).populate('vendor', 'name address rating');
        if (listing) {
            res.json(listing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a listing
// @route   POST /api/listings
// @access  Private (Vendor)
const createListing = async (req, res) => {
    console.log('CONTROLLER: createListing accessed');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    try {
        const { title, description, originalPrice, discountedPrice, quantity, pickupStart, pickupEnd } = req.body;
        
        // Image handling with Cloudinary
        let image = null;
        if (req.file) {
            // Cloudinary automatically uploads and provides the URL
            image = req.file.path; // Cloudinary secure URL
        }

        const listing = new FoodListing({
            vendor: req.user._id,
            title,
            description,
            originalPrice: Number(originalPrice),
            discountedPrice: Number(discountedPrice),
            quantity: Number(quantity),
            remainingQuantity: Number(quantity),
            pickupStart: new Date(pickupStart),
            pickupEnd: new Date(pickupEnd),
            image
        });

        const createdListing = await listing.save();
        console.log('CONTROLLER: Listing Saved');
        res.status(201).json(createdListing);
    } catch (error) {
        console.error('CONTROLLER ERROR:', error);
        res.status(400).json({ message: 'Invalid listing data', error: error.message });
    }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (Vendor)
const updateListing = async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);

        if (listing) {
            if (listing.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }

            const { title, description, category, originalPrice, discountedPrice, quantity, pickupStart, pickupEnd } = req.body;

            listing.title = title || listing.title;
            listing.description = description || listing.description;
            listing.category = category || listing.category;
            listing.originalPrice = originalPrice ? Number(originalPrice) : listing.originalPrice;
            listing.discountedPrice = discountedPrice ? Number(discountedPrice) : listing.discountedPrice;
            listing.quantity = quantity ? Number(quantity) : listing.quantity;
            listing.pickupStart = pickupStart ? new Date(pickupStart) : listing.pickupStart;
            listing.pickupEnd = pickupEnd ? new Date(pickupEnd) : listing.pickupEnd;

            if (req.file) {
                // Cloudinary URL from uploaded file
                listing.image = req.file.path;
            }

            const updatedListing = await listing.save();
            res.json(updatedListing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Vendor/Admin)
const deleteListing = async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);

        if (listing) {
            if (listing.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }
            
            await listing.deleteOne();
            res.json({ message: 'Listing removed' });
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getListings, getListingById, createListing, deleteListing, updateListing };
