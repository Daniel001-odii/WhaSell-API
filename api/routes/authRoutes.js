const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register/primary', authController.register);
router.post('/register/secondary', authController.registerSeller);
router.post('/login', authController.login);
router.post('/token', authController.token);
router.post('/logout', authController.logout);

// A protected route example
router.get('/protected', protect, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

// verification of emails
router.post('/email_verify', authController.verifyEmail);
router.post('/email_verification/send', authController.sendVerificationMail);


router.post('/password_reset/link', authController.sendPasswordResetLink);
router.post('/password_reset', authController.resetPassword);


// upload shop image on register
router.post('/shop_register/image', authController.uploadShopImage);
module.exports = router;
