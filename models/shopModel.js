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
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }], 
    followers_count: Number,
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
    owner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    products: {
        type: Array,
    },
    listings: Number,
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