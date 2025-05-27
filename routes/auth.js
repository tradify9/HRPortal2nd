const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { login, changePassword } = require('../controllers/authController');

router.post('/login', login);
router.put('/change-password', auth, changePassword);

module.exports = router;