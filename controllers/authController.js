const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { id, password, role } = req.body;

  try {
    if (!id || !password || !role) {
      console.log('Login: Missing fields', { id, role });
      return res.status(400).json({ msg: 'Please enter ID, password, and select a role' });
    }

    if (!['admin', 'employee'].includes(role)) {
      console.log('Login: Invalid role', { id, role });
      return res.status(400).json({ msg: 'Invalid role selected' });
    }

    const user = await User.findOne({ employeeId: id.trim().toUpperCase(), role });
    if (!user) {
      console.log('Login: User not found', { id, role });
      return res.status(400).json({ msg: `Invalid ${role === 'admin' ? 'Admin ID' : 'Employee ID'} or Password` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login: Password mismatch', { id, role });
      return res.status(400).json({ msg: `Invalid ${role === 'admin' ? 'Admin ID' : 'Employee ID'} or Password` });
    }

    const payload = {
      employeeId: user.employeeId,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login: Success', { id, role });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', { id, role, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};