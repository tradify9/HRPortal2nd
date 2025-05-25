const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { assignTask, getTasks, updateTaskStatus } = require('../controllers/taskController');

router.post('/assign', auth, assignTask);
router.get('/', auth, getTasks);
router.put('/:id', auth, updateTaskStatus);

module.exports = router;