var mongoose = require('mongoose'), Schema = mongoose.Schema;

const productCategorySchema = new Schema({
    name: {
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
            "Travel & Luggage",
            "other",
        ],
    }
});

module.exports = mongoose.model('Product Category', productCategorySchema);