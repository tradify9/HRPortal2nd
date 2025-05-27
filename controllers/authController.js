const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateEmployeeId } = require('../utils/generateEmployeeId');

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
    let user = await User.findOne({ email }).lean();
    console.log('Employee Login: Fetched user from DB', { email, user });

    if (!user) {
      // Create a new user if not found
      user = new User({
        email,
        role: 'employee',
        name: 'Test Employee', // Default name
      });
      await user.save();
      console.log('Employee Login: Created new user', { email });
    }

    // Ensure there's a corresponding Employee record
    let employee = await Employee.findOne({ email }).lean();
    if (!employee) {
      const employeeId = await generateEmployeeId();
      employee = new Employee({
        employeeId,
        name: user.name || 'Test Employee',
        email,
        position: 'Employee', // Default position
        salary: 50000, // Default salary
      });
      await employee.save();
      console.log('Employee Login: Created new employee record', { email, employeeId });

      // Update User with employeeId if not present
      await User.findOneAndUpdate(
        { email },
        { employeeId, name: employee.name },
        { new: true }
      );
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