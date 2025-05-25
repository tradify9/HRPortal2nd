const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');
const connectDB = require('./config/db');
require('dotenv').config();

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      employeeId: 'ADMIN001',
      password: adminPassword,
      role: 'admin',
    });
    await adminUser.save();

    const adminEmployee = new Employee({
      employeeId: 'ADMIN001',
      name: 'Admin User',
      email: 'admin@example.com',
      position: 'Administrator',
      salary: 0,
    });
    await adminEmployee.save();

    // Create test employee
    const employeePassword = await bcrypt.hash('emp123', 10);
    const testEmployeeUser = new User({
      employeeId: 'EMP0001',
      password: employeePassword,
      role: 'employee',
    });
    await testEmployeeUser.save();

    const testEmployee = new Employee({
      employeeId: 'EMP0001',
      name: 'Test Employee',
      email: 'employee@example.com',
      position: 'Developer',
      salary: 50000,
    });
    await testEmployee.save();

    console.log('Database seeded successfully with ADMIN001 (admin) and EMP0001 (employee)');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();