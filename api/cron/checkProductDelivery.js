const cron = require('node-cron');
const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const { EMAIL_HEADER_SECTION, EMAIL_FOOTER_SECTION } = require('../utils/emailTemplates');

// Function to send delivery confirmation email
const sendDeliveryConfirmationEmail = async (ownerEmail, productName) => {
    const emailHtml = `
        <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            ${EMAIL_HEADER_SECTION}
            <tr>
                <td style="padding: 20px;">
                    <h2>Product Delivery Confirmation Required</h2>
                    <p>Hello,</p>
                    <p>We noticed that your product "${productName}" has been marked as sold but not yet delivered.</p>
                    <p>Please confirm if this product has been delivered to the buyer by updating its status in your dashboard.</p>
                    <p>If the product has been delivered, please mark it as "delivered" in your product management section.</p>
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                </td>
            </tr>
            ${EMAIL_FOOTER_SECTION}
        </table>
    `;

    try {
        await sendEmail({
            emailTo: ownerEmail,
            subject: 'Action Required: Confirm Product Delivery Status',
            html: emailHtml
        });
        console.log(`Delivery confirmation email sent to ${ownerEmail} for product ${productName}`);
    } catch (error) {
        console.error(`Failed to send delivery confirmation email to ${ownerEmail}:`, error);
    }
};

// Function to check products and send alerts
const checkProductDeliveryStatus = async () => {
    try {
        // Find all products that are sold but not delivered
        const products = await Product.find({
            'status.value': 'sold',
            'status.date_of_delivery': { $exists: false }
        }).populate({
            path: 'shop',
            populate: {
                path: 'owner',
                select: 'email' // Only select the email field from the owner
            }
        });

        console.log(`Found ${products.length} products that need delivery confirmation`);

        // Send email alerts for each product
        for (const product of products) {
            if (product.shop && product.shop.owner && product.shop.owner.email) {
                await sendDeliveryConfirmationEmail(product.shop.owner.email, product.name);
            }
        }
    } catch (error) {
        console.error('Error in checkProductDeliveryStatus:', error);
    }
};

// Schedule the cron job to run every day at 9:00 AM
const scheduleDeliveryCheck = () => {
    cron.schedule('0 9 * * *', () => {
        console.log('Running product delivery status check...');
        checkProductDeliveryStatus();
    });
};

module.exports = {
    scheduleDeliveryCheck,
    checkProductDeliveryStatus // Export for testing purposes
}; 