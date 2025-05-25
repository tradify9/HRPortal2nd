const express = require('express');
   const router = express.Router();
   const { generateSalarySlip, emailSalarySlip } = require('../controllers/salaryController');
   const auth = require('../middleware/auth');

   router.post('/generate', auth, generateSalarySlip); // Generate and download slip
   router.post('/email', auth, emailSalarySlip); // Email slip (admin)

   module.exports = router;