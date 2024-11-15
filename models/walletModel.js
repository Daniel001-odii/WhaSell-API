// models/room.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  balance: {
    type: Number,
    default: 10,
  },
  status: {
    type: String,
    enum: ["active", "onhold", "blocked"],
    default: "active"
  },

  debit_transactions: [{
    date: {
      type: Date,
      default: Date.now()
    },
    coin_amount: Number,
    narration: String,
  }],

  transactions: [{
    date: {
        type: Date,
        default: Date.now()
    },
    amount: Number,
    reference: String,
    status: {
      type: String,
      enum: ["successful", "pending", "failed"],
      default: "pending",
    }
  }],

}, {timestamps: true});

module.exports = mongoose.model('Wallet', walletSchema);