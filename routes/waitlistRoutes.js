const express = require('express');
const router = express.Router();
const waitListController = require('../controllers/waitlistController');

// add user to waitlist...
router.post('/waitlist', waitListController.addUserToWaitlist);

module.exports = router;
