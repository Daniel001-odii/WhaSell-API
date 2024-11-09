// shop routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");

const userController = require('../controllers/userController');

router.get('/user', protect, userController.getUserDetails);


router.patch('/user/update', protect, userController.updateUserProfile);

router.patch('/user/profile-image', protect, userController.changeUserProfileImage);

router.get('/user/likes', protect, userController.getUserLikedProducts);

// user wallet..
router.get('/user/wallet', protect, userController.getUserWallet);


// PAYSTACK...
router.post('/user/buy_coins', protect, userController.buyCoins);

router.get('/user/webhook/paystack', userController.paystackWebhook);

router.get('/user/coin_purchase/:ref/status', protect, userController.checkPaymentStatus);


module.exports = router;