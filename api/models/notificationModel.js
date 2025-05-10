const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'review', 'purchase', 'follow', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    related_product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    related_shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    },
    is_read: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
