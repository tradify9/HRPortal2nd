const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Log to verify this file is loaded
console.log('authController loaded');

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();
    console.log('Admin Login: Fetched user from DB', { email, user });

    if (!user) {
      console.log('Admin Login: User not found', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!password) {
      console.log('Admin Login: Password required', { email });
      return res.status(400).json({ msg: 'Password is required for admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Admin Login: Invalid password', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        email: user.email,
        role: 'admin',
      },
    };

    console.log('Admin Login: JWT Payload', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    const response = { token, email: user.email, role: 'admin' };
    console.log('Admin Login: Sending response', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Admin Login error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.employeeLogin = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email }).lean();
    console.log('Employee Login: Fetched user from DB', { email, user });

    if (!user) {
      console.log('Employee Login: User not found', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        email: user.email,
        role: 'employee',
      },
    };

    console.log('Employee Login: JWT Payload', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    const response = { token, email: user.email, role: 'employee' };
    console.log('Employee Login: Sending response', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Employee Login error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};