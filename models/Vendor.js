const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Business Name
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: 'vendor' },
    address: { type: String, required: true },
    place: { type: String }, // Specific town/locality
    district: { type: String },
    state: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    description: { type: String },
    licenseNumber: { type: String }, // FSSAI or equivalent
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    image: { type: String }, // Vendor Logo/Image
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', VendorSchema);
