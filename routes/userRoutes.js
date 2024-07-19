// shop routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");

const userController = require('../controllers/userController');

router.get('/user', protect, userController.getUserDetails);


router.patch('/user/update', protect, userController.updateUserProfile);
// 

module.exports = router;