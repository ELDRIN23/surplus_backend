const FoodListing = require('../models/FoodListing');

// Scheduled job to automatically expire listings
const expireListings = async () => {
    try {
        const currentTime = new Date();
        const result = await FoodListing.updateMany(
            { 
                status: 'active',
                pickupEnd: { $lt: currentTime }
            },
            { 
                $set: { status: 'expired' }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Expired ${result.modifiedCount} listing(s) at ${currentTime.toISOString()}`);
        }
    } catch (error) {
        console.error('Error expiring listings:', error);
    }
};

// Run every 5 minutes
const startExpirationScheduler = () => {
    // Run immediately on startup
    expireListings();
    
    // Then run every 5 minutes
    setInterval(expireListings, 5 * 60 * 1000);
    
    console.log('Listing expiration scheduler started');
};

module.exports = { startExpirationScheduler };
