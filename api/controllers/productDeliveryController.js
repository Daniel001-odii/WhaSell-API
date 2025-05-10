const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const Transaction = require('../models/transactionModel');

// Get products that need delivery confirmation for a shop owner
const getPendingDeliveryProducts = async (req, res) => {
    try {
        // Get the shop owned by the logged-in user
        const shop = await Shop.findOne({ owner: req.user });
        
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'No shop found for this user'
            });
        }

        // Find products that are sold but not delivered for this shop
        const products = await Product.find({
            shop: shop._id,
            'status.value': 'sold',
            'status.date_of_delivery': { $exists: false }
        }).select('name price status.value status.date_of_sale images'); // Select only necessary fields

        return res.status(200).json({
            success: true,
            data: {
                products,
                count: products.length
            }
        });

    } catch (error) {
        console.error('Error in getPendingDeliveryProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching pending delivery products',
            error: error.message
        });
    }
};

/**
 * Confirm product delivery by seller
 * @route PUT /api/delivery/confirm-sent/:transactionId
 */
const confirmProductSent = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const sellerId = req.user;

        // Find the transaction and verify seller ownership
        const transaction = await Transaction.findOne({
            _id: transactionId,
            seller: sellerId
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found or unauthorized'
            });
        }

        // Update delivery status to in_transit
        transaction.delivery_status = 'in_transit';
        transaction.delivery_date = new Date();
        await transaction.save();

        // Update product status
        const product = await Product.findById(transaction.product);
        if (product) {
            product.status.value = 'in_transit';
            product.status.date_of_delivery = new Date();
            await product.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Product delivery confirmed successfully',
            data: transaction
        });

    } catch (error) {
        console.error('Error in confirmProductSent:', error);
        return res.status(500).json({
            success: false,
            message: 'Error confirming product delivery',
            error: error.message
        });
    }
};

/**
 * Confirm product received by buyer
 * @route PUT /api/delivery/confirm-received/:transactionId
 */
const confirmProductReceived = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { email } = req.body; // Buyer's email for verification

        // Find the transaction and verify buyer
        const transaction = await Transaction.findOne({
            _id: transactionId,
            'buyer.email': email
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found or unauthorized'
            });
        }

        // Update delivery status to delivered
        transaction.delivery_status = 'delivered';
        await transaction.save();

        // Update product status
        const product = await Product.findById(transaction.product);
        if (product) {
            product.status.value = 'delivered';
            await product.save();
        }

        // Update transaction status to completed
        transaction.status = 'completed';
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: 'Product received confirmation successful',
            data: transaction
        });

    } catch (error) {
        console.error('Error in confirmProductReceived:', error);
        return res.status(500).json({
            success: false,
            message: 'Error confirming product receipt',
            error: error.message
        });
    }
};

module.exports = {
    getPendingDeliveryProducts,
    confirmProductSent,
    confirmProductReceived
}; 