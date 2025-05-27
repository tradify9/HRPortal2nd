const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    if (!employeeId || !password) {
      console.log('Login: Missing fields', { employeeId, password });
      return res.status(400).json({ msg: 'Please provide employee ID and password' });
    }

    const user = await User.findOne({ employeeId });
    if (!user) {
      console.log('Login: User not found', { employeeId });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login: Password mismatch', { employeeId });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        employeeId: user.employeeId,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login: Success', { employeeId, role: user.role });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', { employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      console.log('Change Password: Missing fields', { employeeId: req.user.employeeId });
      return res.status(400).json({ msg: 'Please provide old and new passwords' });
    }

    const user = await User.findOne({ employeeId: req.user.employeeId });
    if (!user) {
      console.log('Change Password: User not found', { employeeId: req.user.employeeId });
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      console.log('Change Password: Incorrect old password', { employeeId: req.user.employeeId });
      return res.status(400).json({ msg: 'Incorrect old password' });
    }

    if (newPassword.length < 8) {
      console.log('Change Password: New password too short', { employeeId: req.user.employeeId });
      return res.status(400).json({ msg: 'New password must be at least 8 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('Change Password: Success', { employeeId: req.user.employeeId });
    res.json({ msg: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password error:', { employeeId: req.user.employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};