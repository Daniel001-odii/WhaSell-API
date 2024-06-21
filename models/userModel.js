var mongoose = require('mongoose'), Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');


const userSchema = new Schema({
  /*
    email: {
      type: String,
      unique: [true, "email already exists in database!"],
      lowercase: true,
      trim: true,
      required: [true, "email not provided"],
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '{VALUE} is not a valid email!'
      }
  
    },*/
    password: {
      type: Object,
    },
    username: {
        type: String,
        required: true,
    },
 
    // PROVIDER AND GOOGLE ID....
    provider: {
      type: String,
      enum: ["native", "google"],
      default: "native"
    },
    googleId: Number,
    // PROVIDER AND GOOGLE ID ENDS HERE...

    credits: {
        type: Number,
        default: 0,
    },

    likes: [{
        type:mongoose.Schema.Types.ObjectId, ref: 'Product'
    }],

    profile: {
      whatsapp: String,
      socials: [{
        type: String,
      }],
      image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
      },

    is_deleted: {type: Boolean, default: false},
    is_on_hold: {type: Boolean, default: false},
    email_verified: {
      type: Boolean,
      default: false,
    },

    subscription:{
        type: String,
        enum: ["basic", "premium"],
        default: "basic",
    },

    refreshToken: { type: String },

    verification_token: String,
    
    pass_reset: {
      token: String,
      expiry_date: Date,
    },

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

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


  
module.exports = mongoose.model('User', userSchema);