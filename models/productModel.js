var mongoose = require('mongoose'), Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type:  String,
        required: [true, "product name is required"],
    },
    description: {
        type: String,
        required: [true, "product description is required"],
    },
    images: [{
        type: String,
        required:  [true, "atleast one product image is required"],
    }],
    price: {
        type: Number,
        required: [true, "product price is required"],
    },
    discount: Number,
    category:{
        type: String,
        enum: [
            "Electronics & Gadgets",
            "Health & Beauty",
            "Automotive",
            "Office Supplies",
            "Arts & Crafts Supplies",
            "Fashion & Apparel",
            "Books & Media",
            "Toys & Games",
            "Pet Supplies",
            "Jewelry & Watches",
            "Home & Kitchen",
            "Sports & Outdoors",
            "Grocery & Gourmet Food",
            "Baby Products",
            "Travel & Luggage"
        ],
        required: [true, "product category is required"],
    },
    boosted: {
        type: Boolean,
        default: false,
    },
    condition: {
        type: String,
        enum: [
            "brand new",
            "refurbished",
            "refurbished by manufacturer",
            "fairly used"
        ],
        required: [true, "product condition is required"],
    },
    charge_for_delivery: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no',
        required: [true, "product price is required"],
    },
    delivery_fee: Number,
    price_negotiable: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no',
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Shop',
        required: [true, "shop is required"],
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