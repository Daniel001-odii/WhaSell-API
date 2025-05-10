const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const coinTransactionSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balance_after: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    narration: {
        type: String,
        required: true
    },
    payment_details: {
        provider_reference: String,
        payment_date: Date,
        payment_method: String
    }
}, { timestamps: true });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema); 