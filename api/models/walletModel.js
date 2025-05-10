// models/room.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  credit_balance: {
    type: Number,
    default: 10,
  },
  available_funds: {
    type: Number,
    default: 0,
  },
  pending_funds: {
    type: Number,
    default: 0
  },
  withdrawal_settings: {
    bank_code: String,
    account_number: String,
    account_name: String,
    bank_name: String,
  },
  status: {
    type: String,
    enum: ["active", "onhold", "blocked"],
    default: "active"
  }
}, {timestamps: true});

module.exports = mongoose.model('Wallet', walletSchema);