const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      console.log('Login: Missing email');
      return res.status(400).json({ msg: 'Please provide an email' });
    }

    if (!email.endsWith('@gmail.com')) {
      console.log('Login: Not a Gmail address', { email });
      return res.status(400).json({ msg: 'Please use a Gmail address to login' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login: User not found', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // For admins, require a password
    if (user.role === 'admin') {
      if (!password) {
        console.log('Login: Password required for admin', { email });
        return res.status(400).json({ msg: 'Password is required for admin login' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Login: Password mismatch for admin', { email });
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
    }

    // For employees, no password is needed
    const payload = {
      user: {
        email: user.email,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login: Success', { email, role: user.role });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', { email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};