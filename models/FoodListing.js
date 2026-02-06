const mongoose = require('mongoose');

const FoodListingSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { 
        type: String, 
        enum: ['Meals', 'Bakery', 'Both'], 
        required: true,
        default: 'Meals'
    },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }, // Total bundles available
    remainingQuantity: { type: Number, required: true },
    pickupStart: { type: Date, required: true },
    pickupEnd: { type: Date, required: true },
    image: { type: String },
    status: { type: String, enum: ['active', 'sold_out', 'expired'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FoodListing', FoodListingSchema);
