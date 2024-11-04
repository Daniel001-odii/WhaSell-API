const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const user = require('../models/userModel');


const { profileImageUpload } = require("../utils/uploadConfig");
const getFullUrl = require('../utils/getFullPath');
const userModel = require('../models/userModel');

const axios = require('axios');
require('dotenv').config();

// get details user by middleware
exports.getUserDetails = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await User.findById(user_id).populate("shop");

        res.status(200).json({ user });
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
        const { username, email, phone, location, socials } = req.body;

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
        user.email = email || user.email;
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

exports.buyCoins = async (req, res) => {
    try {
        const userId = req.user;
        const user = await userModel.findById(userId);
        const email = user.email;

        console.log("the user: ", user);

        const { amount } = req.body;

        // Check if required fields are present
        if (!email || !amount || !userId) {
            return res.status(400).json({ message: "Email, amount, and userId are required" });
        }

        const reference = generateReference();

        // Initiate the payment with Paystack
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Paystack works in kobo, so multiply by 100 for Naira
                reference,
                callback_url: `${process.env.BASE_URL}/webhook/paystack` // Where Paystack will send transaction updates
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
        res.status(200).json({ payment_url: authorization_url });

    } catch (error) {
        console.error("Error initializing Paystack transaction: ", error);
        res.status(500).json({ message: "Failed to initialize transaction" });
    }
};


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