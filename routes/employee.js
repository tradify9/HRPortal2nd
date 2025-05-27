const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addEmployee, uploadEmployeesCSV, getEmployees, deleteEmployee, getEmployeeById, updateEmployee, getCurrentEmployee } = require('../controllers/employeeController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/', auth, addEmployee);
router.post('/upload', auth, upload.single('file'), uploadEmployeesCSV);
router.get('/', auth, getEmployees);
router.delete('/:id', auth, deleteEmployee);
router.get('/:id', auth, getEmployeeById);
router.put('/edit/:id', auth, updateEmployee);
router.get('/me', auth, getCurrentEmployee);

module.exports = router;