const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [{
        listing: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true } // Store price in case it changes
    }],
    totalAmount: { type: Number, required: true },
    paymentId: { type: String }, // Razorpay Payment ID
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: { type: String, enum: ['placed', 'collected', 'cancelled'], default: 'placed' },
    pickupCode: { type: String }, // Secret code for manual verification
    qrCodeData: { type: String }, // String to generate QR code from (Order ID)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
