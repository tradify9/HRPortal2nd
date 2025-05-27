const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const employeeController = require('../controllers/employeeController');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
  if (!token) {
    console.log('Auth Middleware: No token provided');
    return res.status(401).json({ msg: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded.user; // { email, role }
    next();
  } catch (error) {
    console.log('Auth Middleware: Invalid token', { error: error.message });
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

// Log to verify this file is loaded
console.log('employeeRoutes loaded');

// Define routes
router.get('/current', authMiddleware, employeeController.getCurrentEmployee);
router.get('/me', authMiddleware, employeeController.getCurrentEmployee); // Added to support frontend
router.post('/add', employeeController.addEmployee);
router.post('/upload', employeeController.uploadEmployeesCSV);
router.get('/', employeeController.getEmployees);
router.delete('/:id', employeeController.deleteEmployee);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);

// Log to verify routes are registered
console.log('Employee routes registered:', router.stack.map(r => r.route?.path));

module.exports = router;