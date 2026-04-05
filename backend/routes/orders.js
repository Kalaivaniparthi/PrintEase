const express = require('express');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper — emit socket event to all connected clients
function emitOrderUpdate(req, order) {
    const io = req.app.get('io');
    if (io) io.emit('order:updated', { orderId: order.orderId, status: order.status, order });
}

// GET /api/orders — students see own, staff/admin see all
router.get('/', protect, async (req, res) => {
    try {
        const filter = req.user.role === 'student' ? { userId: req.user.email } : {};
        const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'firstName lastName email');
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id }).populate('user', 'firstName lastName email');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Students can only see their own orders
        if (req.user.role === 'student' && order.userId !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/orders — create new order (student only)
router.post('/', protect, authorize('student'), async (req, res) => {
    try {
        const { file, pages, copies, color, sides, size, instructions, amount } = req.body;

        if (!file || !file.url || !amount) {
            return res.status(400).json({ success: false, message: 'File and amount are required.' });
        }

        const order = await Order.create({
            user:      req.user._id,
            userId:    req.user.email,
            ownerName: `${req.user.firstName} ${req.user.lastName}`,
            file,
            pages:    pages || 1,
            copies:   copies || 1,
            color:    color || 'Black & White',
            sides:    sides || 'single',
            size:     size || 'A4',
            instructions: instructions || '',
            amount,
            statusHistory: [{ status: 'Pending', updatedBy: req.user.email }]
        });

        // Notify all connected clients (staff dashboard) about new order
        emitOrderUpdate(req, order);

        res.status(201).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/orders/:id/status — staff/admin update order status
router.patch('/:id/status', protect, authorize('staff', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Printing', 'Ready', 'Completed', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const order = await Order.findOne({ orderId: req.params.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        order.status = status;
        order.statusHistory.push({ status, updatedBy: req.user.email });
        await order.save();

        // Real-time push to all clients
        emitOrderUpdate(req, order);

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/orders/:id/payment — mark payment info after Razorpay verification
router.patch('/:id/payment', protect, async (req, res) => {
    try {
        const { method, status, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const order = await Order.findOne({ orderId: req.params.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        if (req.user.role === 'student' && order.userId !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        order.payment = {
            method,
            status,
            razorpayOrderId:   razorpayOrderId || '',
            razorpayPaymentId: razorpayPaymentId || '',
            razorpaySignature: razorpaySignature || '',
            paidAt: status === 'paid' ? new Date() : undefined
        };

        // Move to Printing if paid online, keep Pending if cash
        if (status === 'paid') {
            order.status = 'Printing';
            order.statusHistory.push({ status: 'Printing', updatedBy: req.user.email });
        }

        await order.save();
        emitOrderUpdate(req, order);

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/orders/:id/assign — admin assigns staff to an order
router.patch('/:id/assign', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            { assignedStaff: req.body.assignedStaff || '' },
            { new: true }
        );
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/orders/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ orderId: req.params.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.json({ success: true, message: 'Order deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
