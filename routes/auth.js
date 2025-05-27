const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Log to verify this file is loaded
console.log('authRoutes loaded');

// Define routes
router.post('/admin-login', authController.adminLogin);
router.post('/employee-login', authController.employeeLogin);

// Log to verify routes are registered
console.log('Auth routes registered:', router.stack.map(r => r.route?.path));

module.exports = router;