var mongoose = require('mongoose'), Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const ShopModel = require('../models/shopModel');

const userSchema = new Schema({
  
    email: {
      type: String,
      unique: [true, "email already registered!"],
      lowercase: true,
      trim: true,
      required: [true, "email is required"],
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '{VALUE} is not a valid email!'
      }
  
    },
    password: {
      type: Object,
      required: [true, "password is required"],
    },
    username: {
      type: String,
      required: [true, "username is required"],
    },
    account_type: {
      type: String,
      enum: ["buyer","seller"],
      default: "buyer"
    },

 
    // PROVIDER AND GOOGLE ID....
    provider: {
      type: String,
      enum: ["native", "google"],
      default: "native"
    },
    googleId: Number,
    // PROVIDER AND GOOGLE ID ENDS HERE...

   /*  credits: {
        type: Number,
        default: 10,
    }, */

    shop: {
      type:mongoose.Schema.Types.ObjectId, ref: 'Shop'
    },

    liked_products: [{
      type:mongoose.Schema.Types.ObjectId, ref: 'Product'
    }],

    phone: {
      type: String,
      required: [true, "phone is required"],
      unique: [true, "phone already registered!"],
    },

    profile: {
      whatsapp: String,
      socials: {
        whatsapp: String,
        youtube: String,
        facebook: String,
        instagram: String,
        twitter: String,
      },
      image_url: {
        type: String, 
        default: 'https://raw.githubusercontent.com/Daniel001-odii/aiCoaches/main/images/no_profile_image.png'},
      },

    is_deleted: {type: Boolean, default: false},
    is_on_hold: {type: Boolean, default: false},
    email_verified: {
      type: Boolean,
      default: false,
    },

    location: {
      state: String,
      LGA: String,
      address: String,
    },

    subscription:{
        type: String,
        enum: ["basic", "standard", "premium"],
        default: "basic",
    },

    refreshToken: { type: String },

    verification_token: String,
    
    pass_reset: {
      token: String,
      expiry_date: Date,
    },

    email_verification: {
      token: String,
      expiry_date: Date,
      is_verified: {
        type: Boolean,
        default: false,
      },
    },

    shops_visited_previously: [{
      type:mongoose.Schema.Types.ObjectId, ref: 'Shop'
    }],

    followed_shops: [{
      type:mongoose.Schema.Types.ObjectId, ref: 'Shop'
    }],
    refferal_code: String,

    // settings starts here....
    settings: {
      notifications: {
        messages: {type: Boolean, default: true},
        emails: {type: Boolean, default: true},
      },
      KYC: {
        NIN_number: String,
        is_verified: {type: Boolean, default: false},
      }
    },
    // settings ends here...

  }, {timestamps: true});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


// update user's shop once location changes...
userSchema.pre('save', async function (next) {
  if(!this.isModified('location')){
    return next();
  };
  const shop = await ShopModel.findById(this.shop);
  shop.profile.location = this.location
  await shop.save();
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


  
module.exports = mongoose.model('User', userSchema);