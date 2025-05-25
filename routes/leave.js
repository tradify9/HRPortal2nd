const express = require('express');
   const router = express.Router();
   const { submitLeave, approveLeave, getLeaves } = require('../controllers/leaveController');
   const auth = require('../middleware/auth');

   router.post('/', auth, submitLeave); // Employee submits leave
   router.put('/approve/:leaveId', auth, approveLeave); // Admin approves/rejects
   router.get('/', auth, getLeaves); // Get leaves (admin: all, employee: own)

   module.exports = router;