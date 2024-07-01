var mongoose = require('mongoose'), Schema = mongoose.Schema;

const shopSchema = new Schema({
    name: {
        type: String,
        required: true,
        set: value => value.toLowerCase() // Ensure the name is stored in lowercase
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: [
            "electronics",
            "furniture",
            "clothing & textile",
            "fashion & beauty",
            "health",
            "tools & industrial",
            "arts & crafts",
            "footwears",
            "phone & telecoms", 
            "accessories", 
            "phones",
            "baby, kids & toys",
            "drinks & groceries",
            "other"
        ],
    },

    followers: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }], 
    reviews:{
        rating: Number,
        count: Number,
    },
    views: {
        type: Number,
        default: 0,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    products: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Product'
    },
    profile: {
        image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
        location: {
            city: String,
            LGA: String,
            state: String,
            address: String,
        },
        phone: String,
        socials: [{
            type: String,
          }],
        },
    
   
    badge: {
        type: String,
        default: "none"
    },
    availability: {
        days: String,
        time: String,
    },

}, {timestamps: true});


module.exports = mongoose.model('Shop', shopSchema);