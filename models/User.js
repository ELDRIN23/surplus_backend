const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    place: { type: String },
    district: { type: String },
    state: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    image: { type: String },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    isBlocked: { type: Boolean, default: false },
    cart: [{
        listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing' },
        quantity: { type: Number, default: 1 }
    }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
