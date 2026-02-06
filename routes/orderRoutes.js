const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyOrders, simulatePayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/myorders', protect, getMyOrders);
router.post('/:id/simulate-payment', protect, simulatePayment);

module.exports = router;
