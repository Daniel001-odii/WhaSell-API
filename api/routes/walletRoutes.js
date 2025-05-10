const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Route to update withdrawal settings
router.put('/withdrawal-settings', walletController.updateWithdrawalSettings);

// Route to get withdrawal settings
router.get('/withdrawal-settings', walletController.getWithdrawalSettings);

// Route to fetch banks via Paystack
router.get('/banks', walletController.fetchBanks);

// Route to get paginated transactions
router.get('/transactions', walletController.getTransactions);

module.exports = router; 