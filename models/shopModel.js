var mongoose = require('mongoose'), Schema = mongoose.Schema;

const shopSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: [true, "shop name is already taken"],
        set: value => value.toLowerCase().split(" ").join("") // Ensure the name is stored in lowercase
    },
    
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
    },

    followers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        date: {
            type: Date,
            default: Date.now(),
        }
    }], 
    
  /*   followers_count: {
        type: Number,
        default: 0
    }, */

    reviews:{
        rating: {
            type: Number,
            default: 0,
        },
        count: Number,
    },
    views: {
        type: Number,
        default: 0,
    },
    sold_products: {
        type: Number,
        default: 0
    },
    best_selling_product: {
        type: String,
        default: ""
    },

    shop_visitors: {
        type: Number,
        default: 0
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    products: {
        type: Array,
    },
    listings: Number,
    profile: {
        image_url: {
            type: String, 
            default: 'https://raw.githubusercontent.com/Daniel001-odii/aiCoaches/main/images/no_shop_image.png'},
        location: {
            LGA: String,
            state: String,
            address: String,
        },
        phone: String,
        socials: [{
            type: String,
          }],
        },
    
   
    is_boosted: {
        type: Boolean,
        default: false,
    },
    is_top_seller: {
        type: Boolean,
        default: false,
    },
    is_on_discount: {
        discount_percent: Number,
    },
    is_trending: {
        type: Boolean,
        default: false,
    },

    badges: {
        type: String,
        enum: ["top-seller", "on-discout", "boosted", "trending", "out-of-stock"]
    },
    availability: {
        days: String,
        time: String,
    },

}, {timestamps: true});


module.exports = mongoose.model('Shop', shopSchema);