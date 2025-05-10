var mongoose = require('mongoose'), Schema = mongoose.Schema;

const reviewSchema = new Schema({
   
    shop: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Shop',
        required: [true, "shop is required"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: [true, "user is required"],
    },
    product_name: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0,
    },
    feedback: {
        type: String,
    },
    images: [{
        type: String
    }]
}, {timestamps: true});

module.exports = mongoose.model('reviews', reviewSchema);