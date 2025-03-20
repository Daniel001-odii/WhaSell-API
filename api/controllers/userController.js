const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const user = require('../models/userModel');


const { profileImageUpload } = require("../utils/uploadConfig");
const getFullUrl = require('../utils/getFullPath');
const userModel = require('../models/userModel');

const axios = require('axios');
const walletModel = require('../models/walletModel');
require('dotenv').config();


/*
    check email and phone number if it already exists
 */
exports.checkExistingEmail = async (req, res) => {
    try{
        console.log("checking email...")
        const {email} = req.body;
        console.log("client sent email: ", email)
        const existingEmail = await userModel.findOne({ email });
        if(existingEmail){
            return res.status(400).json({ message: "Sorry email already exists"});
        }

        res.status(201).json({ message: "email accepted!"})
    }catch(error){
        res.status(500).json({ error });
    }
};


exports.checkExistingPhone = async (req, res) => {
    try{
        console.log("checking phone...")
        const phone = req.params.phone;
        const existingPhone = await userModel.findOne({ phone });
        if(existingPhone){
            return res.status(400).json({ message: "Sorry phone number already exists"});
        }

        res.status(200).json({ message: "email accepted!"})
    }catch(error){
        res.status(500).json({ message: "error checking phone number", error });
    }
};


// get details user by middleware
exports.getUserDetails = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await User.findById(user_id).populate("shop");

        let wallet;
        wallet = await walletModel.findOne({ user });
        if(!wallet){
            wallet = new walletModel({
                user,
            });
            await wallet.save();
        };
        if(!user.refferal_code){
            let refferal_code = `ref_${Math.random().toString(36).substring(2, 15)}`;
            user.refferal_code = refferal_code.slice(0, 9);
            await user.save();
        }

        // user.credits = wallet.balance;

        res.status(200).json({ user, credits: wallet.balance });
    }catch(error){
        console.log("error getting user detiails: ", error);
        res.status(500).json({ message: "internal server error" });
    }
}


exports.changeUserProfileImage = async (req, res) => {
    try {

        // console.log("from client: ", req);
        // if (!req.file) {
        //     return res.status(400).json({ message: 'No file uploaded.' });
        // }

      // Using multer middleware to handle file upload
      profileImageUpload.single('user_image')(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ error: 'Image upload failed', err });
        }
  
        const user = req.userModel;

        console.log("found user: ", user)
  
        const imagePath = req.file.path;
        const imageFullUrl = getFullUrl(req, imagePath);
  
        user.profile.image_url = imageFullUrl;
        await user.save();
  
        res.status(201).json({ message: "profile image changed successfully!", imageFullUrl });
      });
    } catch (error) {
      console.log("user image upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user;
        const { username, phone, location, socials } = req.body;

        // console.log("username from client: ", username);
        console.log("location from client: ", req.body);

        // Find the user by ID
        let user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        };

        // console.log("user from b-end: ", user)
        // Update user details
        user.username = username || user.username;
        // user.email = email || user.email;
        user.phone = phone || user.phone;
        user.location = location || user.location;
        user.profile.socials = socials || user.profile.socials;

        // Save updated user
        await user.save();

        res.status(200).json({ message: "Profile updated successfully" });
    }catch(error){
        console.log("error updating user: ", error)
        res.status(500).json({ message: "internal server error" });
    }
};

exports.getUserWallet = async (req, res) => {
    try{
        const user = req.user;

        const wallet = await walletModel.findOne({ user });
        if(!wallet){
            const wallet = new walletModel({
                user,
            });

            await wallet.save();

            return res.status(200).json({ wallet });
        }

        wallet.transactions = wallet.transactions.reverse();

        res.status(200).json({ wallet });
    }catch(error){
        console.log("error getting user wallet: ", error);
        res.status(500).json({ message: "internal server error"});
    }
}

exports.getUserLikedProducts = async (req, res) => {
    try{
        // const liked_products = req.userModel.liked_products;
        const user = await userModel.findById(req.user).populate("liked_products");

        const liked_products = user.liked_products;

        res.status(200).json({ liked_products });
    }catch(error){
        console.log("error getting user liked products: ", error)
        res.status(500).json({ message: "internal server error" });
    }
}

// Function to generate a reference for each payment
const generateReference = () => {
    return `ref_${Math.random().toString(36).substring(2, 15)}`;
};


/* 
FOR COINS PURCHASE
FORMULAR
[0.5 x (No. Coins / 10) + 0.5] x 1000

minimum coin purchase = 10;
maximum?= infinity...

*/


exports.buyCoins = async (req, res) => {
    try {
        const userId = req.user;
        const user = await userModel.findById(userId);
        const email = user.email;

        console.log("the user: ", user);

        const { no_of_coins } = req.body;

        // calculate how much for coin purchase using platform algo..
        const amount = (0.5 * (no_of_coins / 10) + 0.5) * 1000;
        // const { amount } = req.body;

        // Check if required fields are present
        /* if (!email || !amount || !userId) {
            return res.status(400).json({ message: "Email, amount, and userId are required" });
        } */

        if (!no_of_coins) {
            return res.status(400).json({ message: "number of coins to purchase is required!" });
        }

        if(no_of_coins < 5){
            return res.status(400).json({ message: "sorry only minimum of 5 coins allowed!"});
        };

       

        const today = new Date();
        const payment_date = today;

        const reference = generateReference();

         // register transaction in user's wallet..
         const wallet = await walletModel.findOne({ user: userId });
         wallet.transactions.push(
             {
                narration: 'paid purchase',
                date: today,
                amount,
                reference,
             }
         );

         await wallet.save();

        const metadata = {
            amount,
            payment_date,
            no_of_coins
        }

        // Initiate the payment with Paystack
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Paystack works in kobo, so multiply by 100 for Naira
                reference,
                metadata,
                // http://localhost:8080/account/subscriptions?payment_status=true&payment_reference=9853dvdf45fd
                callback_url: `${process.env.APP_URL}/account/subscriptions?payment_status=true&payment_reference=${reference}` // Where Paystack will send transaction updates
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        ); 

        // Redirect the user to Paystack's payment page
        const { authorization_url } = response.data.data;
        const { resp } = await response.data;
        res.status(200).json({ payment_url: authorization_url, message: resp, reference });

    } catch (error) {
        console.error("Error initializing Paystack transaction: ", error);
        res.status(500).json({ message: "Failed to initialize transaction" });
    }
};


/* 

const reference = 'YOUR_TRANSACTION_REFERENCE'; // Replace with the actual reference
const url = `https://api.paystack.co/transaction/verify/${reference}`;

const options = {
  headers: {
    Authorization: 'Bearer SECRET_KEY'
  }
};

axios.get(url, options)
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
 */


const creditUSerCoins = async (userId, no_of_coins_to_credit, reference, status) => {
try {
    const wallet = await walletModel.findOne({ user: userId });

    if (!wallet) {
    throw new Error("Wallet not found for the user");
    }

    // Update balance
    wallet.balance += Number(no_of_coins_to_credit);

    // Find transaction by reference
    const transaction = wallet.transactions.find((txn) => txn.reference === reference && txn.status == 'pending');

    if (transaction) {
    // Update transaction status if found
    transaction.status = status;
    } else {
    throw new Error("Transaction not found with the provided reference");
    }

    await wallet.save();

    console.log("User coins credited:", userId, no_of_coins_to_credit);
} catch (error) {
    console.error("Error crediting user coins:", error);
    throw error;
}
};
  

exports.checkPaymentStatus = async (req, res) => {
    try{
        const user = req.user;
        const reference = req.params.ref;

        const url = `https://api.paystack.co/transaction/verify/${reference}`;

        const options = {
            headers: {
              Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        };

        axios.get(url, options)
            .then(response => {
            console.log(response.data);

            const no_of_coins_to_credit = response.data.data.metadata.no_of_coins;

            // credit users coins here...
            if(response.data.data.status == 'success'){
                try{
                    creditUSerCoins(user, no_of_coins_to_credit, reference, 'successful');
                }catch(error){
                    return res.status(400).json({ message: "error crediting coins"});
                }
               
            } else if(response.data.data.status == 'abandoned'){
                try{
                    creditUSerCoins(user, 0, reference, 'pending');
                }catch(error){
                    return res.status(400).json({ message: "error crediting coins"});
                }
            }
            return res.status(200).json({ data: response.data });
        })
            .catch(error => {
            console.error(error);
            return res.status(400).json({ message: "error with checking status"});
        });

          
    }catch(error){
        res.satus(500).json({ message: "error checking payment status"});
    }
}

exports.paystackWebhook = async (req, res) => {
    try {
        const { event, data } = req.body;

        console.log("event : ", event, "data: ", data);

        if (event === "charge.success") {
            const { reference, amount, customer: { email } } = data;

            // Find the user based on the email or reference
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Assign coins based on the amount paid
            const coinsBought = amount / 100; // Convert amount back to Naira
            user.credits = (user.credits || 0) + coinsBought;

            // Save the user's updated coin balance
            await user.save();

            // Respond to Paystack that the webhook was received successfully
            return res.status(200).json({ message: "Transaction verified, coins added" });
        } else {
            // If event is not relevant, respond accordingly
            return res.status(400).json({ message: "Event not handled" });
        }
    } catch (error) {
        console.error("Error handling Paystack webhook: ", error);
        res.status(500).json({ message: "Webhook handling failed" });
    }
};


// FOR ANALYTICS...
// getFollowersCount...

// getproductViews...

// getLikedProducts...

// getCountForsalesByCategory...

// getNo.OfShopVisitors...

// getProductsSold against Time(month, week, day)

// check for last time a user posted a product...
const {
  EMAIL_FOOTER_SECTION,
  EMAIL_HEADER_SECTION,
} = require("../utils/emailTemplates");
const Product = require('../models/productModel');
const sendEmail = require("../utils/sendEmail"); // Assuming you have this utility

exports.checkLastProductListingAndSendEmailAlert = async () => {
    try {
        // Get all users who are sellers and have a shop
        const sellers = await User.find({ 
            account_type: 'seller', 
            shop: { $exists: true }
        }).populate('shop');

        const currentDate = new Date();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

        // Process each seller
        for (const seller of sellers) {
            try {
                // Get the most recent product from this seller's shop
                const latestProduct = await Product.findOne({
                    shop: seller.shop._id
                }).sort({ createdAt: -1 }); // Sort by creation date descending

                let shouldSendEmail = false;
                
                if (!latestProduct) {
                    // If no products exist, check if shop creation is older than 2 days
                    const shopAge = currentDate - new Date(seller.shop.createdAt);
                    shouldSendEmail = shopAge > twoDaysInMs;
                } else {
                    // Check if latest product is older than 2 days
                    const timeSinceLastProduct = currentDate - new Date(latestProduct.createdAt);
                    shouldSendEmail = timeSinceLastProduct > twoDaysInMs;
                }

                if (shouldSendEmail) {
                    const mail_options = {
                        emailTo: seller.email,
                        subject: "Reminder: Add New Products to Your Shop",
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
                                <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                                    <!-- Header Section -->
                                    ${EMAIL_HEADER_SECTION}

                                    <!-- Body Content -->
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="">Hi ${seller.username},</p>
                                            <h1 style="margin: 0 0 20px;">Time to Add New Products!</h1>
                                            <p style="margin: 0 0 20px;">We noticed you haven't added any new products to your shop "${seller.shop.name}" recently. Keep your shop active and attract more customers by listing new items!</p>
                                            <p style="text-align: left; margin: 20px 0;">
                                                <a href="${process.env.APP_URL}/seller/dashboard" style="background-color: #47C67F; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Add Products Now</a>
                                            </p>
                                            <p style="margin: 0 0 20px;">Regular updates keep your shop visible and engaging to buyers.</p>
                                        </td>
                                    </tr>

                                    <!-- Footer Section -->
                                    ${EMAIL_FOOTER_SECTION}

                                </table>
                            </body>
                            </html>
                        `,
                    };

                    await sendEmail(mail_options);
                    console.log(`Email reminder sent to ${seller.email}`);
                }
            } catch (userError) {
                console.error(`Error processing seller ${seller.email}:`, userError);
                continue; // Continue with next seller if one fails
            }
        }

        console.log('Product listing reminder check completed');
    } catch (error) {
        console.error('Error in checkLastProductListingAndSendEmailAlert:', error);
        throw error; // Let the cron job handle the error
    }
};