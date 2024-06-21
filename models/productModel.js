var mongoose = require('mongoose'), Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type:  String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    images: [{
        type: String,
        required: true,
    }],
    price: {
        type: Number,
        required: true,
    },
    discount: Number,
    category:{
        type: String,
        required: true,
        enum: [""],
    },
    boosted: {
        type: Boolean,
        default: false,
    },
    condition: {
        type: String,
        requried: true,
        enum: [""],
    },
    delivery_fee: Number,
    price_negotiable: {
        type: Boolean,
        default: false
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Shop'
    },
    flags: {
        type: Number,
        default: 0,
    },
    views: {
        type: Number,
        default: 0,
    },
}, {timestamps: true});


module.exports = mongoose.model('Product', productSchema);