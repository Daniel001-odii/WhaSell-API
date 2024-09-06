var mongoose = require('mongoose'), Schema = mongoose.Schema;

const glipSchema = new Schema({
    name: {
        type:  String,
        required: [true, "glip name is required"],
    },
    slug: {
        type: String,
        // required: [true, "glip slug is required"],
        // set: value => value.split(" ").join("-")
    },
    description: {
        type: String,
        required: [true, "glip description is required"],
    },
    video_url: {
        type: String,
        required: [true, "glip video url is missing"]
    },
    price: {
        type: Number,
        required: [true, "glip price is required"],
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
            "Baby glips",
            "Travel & Luggage"
        ],
        required: [true, "glip category is required"],
    },
    is_sold: {
        type: Boolean,
        default: false,
      },
    is_boosted: {
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
        required: [true, "glip condition is required"],
    },
    charge_for_delivery: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no',
        required: [true, "glip price is required"],
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


glipSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        return next();
    }
    // Convert name to lowercase, replace spaces with hyphens, and trim any extra whitespace
    const slug = this.name.toLowerCase().trim().split(" ").join("-");
    this.slug = slug;

    console.log(`Generated slug: ${this.slug}`); // Debugging output
    
    next();
});

module.exports = mongoose.model('glip', glipSchema);