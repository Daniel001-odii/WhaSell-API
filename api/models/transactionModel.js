const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    reference: {
        type: String,
        required: true,
        unique: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    buyer: {
        email: {
            type: String,
            required: true
        },
        name: String,
        phone: String
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    platform_fee: {
        type: Number,
        required: true
    },
    seller_amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    payment_provider: {
        type: String,
        enum: ['paystack'],
        default: 'paystack'
    },
    payment_details: {
        provider_reference: String,
        payment_date: Date,
        payment_method: String
    },
    delivery_info: {
        address: String,
        city: String,
        state: String,
        phone: String,
        additional_notes: String
    },
    delivery_status: {
        type: String,
        enum: ['pending', 'in_transit', 'delivered'],
        default: 'pending'
    },
    delivery_date: Date,
    refund_details: {
        reason: String,
        date: Date,
        amount: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema); 