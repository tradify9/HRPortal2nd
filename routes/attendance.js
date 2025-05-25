const express = require('express');
   const router = express.Router();
   const auth = require('../middleware/auth');
   const { getEmployeeAttendance, punchIn, punchOut, downloadAttendance, getAllAttendance } = require('../controllers/attendanceController');

   router.get('/employee', auth, getEmployeeAttendance);
   router.post('/punch-in', auth, punchIn);
   router.post('/punch-out', auth, punchOut);
   router.get('/download', auth, downloadAttendance);
   router.get('/', auth, getAllAttendance);

   module.exports = router;