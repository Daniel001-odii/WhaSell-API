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
    
    deliver_time: {
        max_days: Number,
        grace_days: Number,
    },
    
  /*   followers_count: {
        type: Number,
        default: 0
    }, */
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
    
   
    is_verified: {
        type: Boolean,
        default: false,
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

    template_code: {
        type: Number,
        default: 0,
    },

    accept_payments: {
        type: Boolean,
        default: false,
      },

}, {timestamps: true});


module.exports = mongoose.model('Shop', shopSchema);