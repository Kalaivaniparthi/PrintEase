const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => 'ORD-' + Date.now().toString().slice(-6)
    },

    // Owner
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: String, required: true },       // email — kept for frontend compat
    ownerName: { type: String, default: '' },

    // File
    file: {
        name:        { type: String, required: true },
        url:         { type: String, required: true },  // Cloudinary URL
        publicId:    { type: String, default: '' },     // Cloudinary public_id
        size:        { type: Number, default: 0 },      // bytes
        mimeType:    { type: String, default: '' }
    },

    // Print settings
    pages:        { type: Number, default: 1, min: 1 },
    copies:       { type: Number, default: 1, min: 1 },
    color:        { type: String, enum: ['Black & White', 'Color'], default: 'Black & White' },
    sides:        { type: String, enum: ['single', 'double'], default: 'single' },
    size:         { type: String, enum: ['A4', 'A3', 'Letter'], default: 'A4' },
    instructions: { type: String, default: '' },
    amount:       { type: Number, required: true },

    // Staff assignment
    assignedStaff: { type: String, default: '' },

    // Status
    status: {
        type: String,
        enum: ['Pending', 'Printing', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    statusHistory: [{
        status:    String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: String
    }],

    // Payment
    payment: {
        method:    { type: String, enum: ['upi', 'card', 'cash', ''], default: '' },
        status:    { type: String, enum: ['unpaid', 'paid', 'pay at counter', 'refunded'], default: 'unpaid' },
        razorpayOrderId:   { type: String, default: '' },
        razorpayPaymentId: { type: String, default: '' },
        razorpaySignature: { type: String, default: '' },
        paidAt:    { type: Date }
    }

}, { timestamps: true });

// Virtual for formatted date/time (frontend compat)
orderSchema.virtual('date').get(function () {
    return this.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
});
orderSchema.virtual('time').get(function () {
    return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
