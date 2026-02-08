const Order = require('../models/Order');
const FoodListing = require('../models/FoodListing');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_key_id') {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn('Razorpay keys missing. Payment integration will not work.');
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
const createOrder = async (req, res) => {
    try {
        const { items, vendorId } = req.body; // items: [{ listingId, quantity }]

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        let totalAmount = 0;
        const processedItems = [];

        // Validate items and calculate total
        for (const item of items) {
            const listing = await FoodListing.findById(item.listingId);
            if (!listing) {
                return res.status(404).json({ message: `Listing not found: ${item.listingId}` });
            }
            if (listing.remainingQuantity < item.quantity) {
                return res.status(400).json({ message: `Not enough quantity for ${listing.title}` });
            }
            
            totalAmount += listing.discountedPrice * item.quantity;
            processedItems.push({
                listing: listing._id,
                quantity: item.quantity,
                priceAtPurchase: listing.discountedPrice
            });
        }

        // Create Razorpay Order
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        if (!razorpay) {
            return res.status(503).json({ message: 'Payment gateway not configured. Please contact support.' });
        }
        const razorpayOrder = await razorpay.orders.create(options);

        if (!razorpayOrder) {
            return res.status(500).json({ message: 'Razorpay order creation failed' });
        }

        const order = new Order({
            user: req.user._id,
            vendor: vendorId,
            items: processedItems,
            totalAmount,
            paymentId: razorpayOrder.id, // Store razorpay order id initially in paymentId or add a field? Schema has paymentId, usually used for payment_id. Let's start with razorpay order id here or add correct field. 
            // Better to add `razorpayOrderId` to schema? 
            // For now, I'll stick to 'paymentId' as a generic field, but Razorpay flow has order_id separate.
            // I'll ignore schema change strictly and use the fields I have.
            // I'll put razorpay_order_id in `paymentId` for now, then overwrite with actual payment_id on success? 
            // Or just rely on finding order by user and total?
            // Let's assume I can store metadata.
            paymentStatus: 'pending'
        });

        const createdOrder = await order.save();

        res.status(201).json({
            order: createdOrder,
            razorpayOrderId: razorpayOrder.id,
            amount: options.amount,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify Payment
// @route   POST /api/orders/verify
// @access  Private (User)
const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest('hex');

        if (generated_signature === razorpaySignature) {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = 'paid';
                order.paymentId = razorpayPaymentId;
                order.orderStatus = 'placed';
                
                // Generate QR Data and Pickup Code
                order.pickupCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit unique code
                order.qrCodeData = order._id.toString();

                // Update inventory
                for (const item of order.items) {
                    const listing = await FoodListing.findById(item.listing);
                    if (listing) {
                        listing.remainingQuantity -= item.quantity;
                        if (listing.remainingQuantity <= 0) {
                            listing.status = 'sold_out';
                        }
                        await listing.save();
                    }
                }

                await order.save();
                res.json({ message: 'Payment verified', order });
            } else {
                res.status(404).json({ message: 'Order not found' });
            }
        } else {
            res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private (User)
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('vendor', 'name address')
            .populate('items.listing', 'title image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Simulate Payment (Fake)
// @route   POST /api/orders/:id/simulate-payment
// @access  Private (User)
const simulatePayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (order) {
            order.paymentStatus = 'paid';
            order.paymentId = `fake_pay_${Date.now()}`;
            order.orderStatus = 'placed';
            
            // Generate QR Data and Pickup Code
            order.pickupCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit
            order.qrCodeData = order._id.toString();

            // Update inventory
            for (const item of order.items) {
                const listing = await FoodListing.findById(item.listing);
                if (listing) {
                    listing.remainingQuantity -= item.quantity;
                    if (listing.remainingQuantity <= 0) {
                        listing.status = 'sold_out';
                    }
                    await listing.save();
                }
            }

            await order.save();
            res.json({ message: 'Fake Payment Successfull', order });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createOrder, verifyPayment, getMyOrders, simulatePayment };
