const walletModel = require('../models/walletModel');
const transactionModel = require('../models/transactionModel');
const axios = require('axios');

/**
 * Update withdrawal settings for a user's wallet
 * @route PUT /api/wallet/withdrawal-settings
 * @body { bank_code: string, account_number: string, account_name: string, bank_name: string }
 */
exports.updateWithdrawalSettings = async (req, res) => {
  try {
    const { bank_code, account_number, account_name, bank_name } = req.body;
    const userId = req.user; // Assuming req.user contains the user ID from auth middleware

    const wallet = await walletModel.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    wallet.withdrawal_settings = {
      bank_code,
      account_number,
      account_name,
      bank_name,
    };

    await wallet.save();
    return res.status(200).json({ message: 'Withdrawal settings updated successfully', wallet });
  } catch (error) {
    console.error('Error updating withdrawal settings:', error);
    return res.status(500).json({ message: 'Failed to update withdrawal settings' });
  }
};

/**
 * Get withdrawal settings for a user's wallet
 * @route GET /api/wallet/withdrawal-settings
 */
exports.getWithdrawalSettings = async (req, res) => {
  try {
    const userId = req.user; // Assuming req.user contains the user ID from auth middleware

    const wallet = await walletModel.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    return res.status(200).json({ withdrawal_settings: wallet.withdrawal_settings });
  } catch (error) {
    console.error('Error retrieving withdrawal settings:', error);
    return res.status(500).json({ message: 'Failed to retrieve withdrawal settings' });
  }
};

/**
 * Fetch banks via Paystack
 * @route GET /api/wallet/banks
 */
exports.fetchBanks = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return res.status(200).json({ banks: response.data.data });
  } catch (error) {
    console.error('Error fetching banks:', error.response?.data || error);
    return res.status(500).json({ message: 'Failed to fetch banks' });
  }
};

/**
 * Get paginated transactions for a user
 * @route GET /api/wallet/transactions
 * @query { page: number, limit: number, status: string }
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    // Build query
    const query = { seller: userId };
    if (status) {
      query.status = status;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await transactionModel.countDocuments(query);

    // Fetch transactions with pagination
    const transactions = await transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'title images price');

    return res.status(200).json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Failed to fetch transactions' });
  }
}; 