const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/token', authController.token);
router.post('/logout', authController.logout);

// A protected route example
router.get('/protected', protect, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

module.exports = router;
