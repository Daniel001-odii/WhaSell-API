var mongoose = require('mongoose'), Schema = mongoose.Schema;
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

  }, {timestamps: true});




  
module.exports = mongoose.model('waitlist_user', userSchema);