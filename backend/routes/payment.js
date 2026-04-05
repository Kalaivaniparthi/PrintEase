const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payment/create-order
// Creates a Razorpay order — frontend uses this to open the payment modal
router.post('/create-order', protect, async (req, res) => {
    try {
        const { orderId } = req.body;

        const printOrder = await Order.findOne({ orderId, userId: req.user.email });
        if (!printOrder) {
            return res.status(404).json({ success: false, message: 'Print order not found.' });
        }

        // Razorpay amount is in paise (₹1 = 100 paise)
        const razorpayOrder = await razorpay.orders.create({
            amount:   printOrder.amount * 100,
            currency: 'INR',
            receipt:  orderId,
            notes: {
                printOrderId: orderId,
                studentEmail: req.user.email
            }
        });

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount:          razorpayOrder.amount,
            currency:        razorpayOrder.currency,
            keyId:           process.env.RAZORPAY_KEY_ID,
            prefill: {
                name:  `${req.user.firstName} ${req.user.lastName}`,
                email: req.user.email
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/payment/verify
// Verifies Razorpay signature after payment — MUST be called before marking order as paid
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, printOrderId } = req.body;

        // Signature verification — HMAC SHA256
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Update order payment status
        const order = await Order.findOne({ orderId: printOrderId, userId: req.user.email });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        order.payment = {
            method:            'upi',   // Razorpay handles UPI/card internally
            status:            'paid',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paidAt:            new Date()
        };
        order.status = 'Printing';
        order.statusHistory.push({ status: 'Printing', updatedBy: req.user.email });
        await order.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) io.emit('order:updated', { orderId: order.orderId, status: order.status, order });

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/payment/cash-confirm
// For "Pay at Counter" — order stays Pending but payment method is recorded
router.post('/cash-confirm', protect, async (req, res) => {
    try {
        const { printOrderId } = req.body;

        const order = await Order.findOne({ orderId: printOrderId, userId: req.user.email });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        order.payment.method = 'cash';
        order.payment.status = 'pay at counter';
        await order.save();

        const io = req.app.get('io');
        if (io) io.emit('order:updated', { orderId: order.orderId, status: order.status, order });

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
