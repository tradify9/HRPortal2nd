const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');
const User = require('./models/User');

const seed = async () => {
  let connection;
  try {
    connection = await mongoose.connect('mongodb+srv://fintradify:mRU4GJ82NQLfXPRX@hrportal.8fwiltn.mongodb.net/?retryWrites=true&w=majority&appName=Hrportal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB for seeding');

    await mongoose.connection.dropDatabase();
    console.log('Dropped hr-portal database to start fresh');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      email: 'admin@gmail.com',
      password: hashedAdminPassword,
      role: 'admin',
    });
    await adminUser.save();
    console.log('Admin user seeded: admin@gmail.com');

    const employee = new Employee({
      employeeId: 'EMP0001',
      name: 'Test Employee',
      email: 'test.employee@gmail.com',
      position: 'Developer',
      salary: 50000,
    });
    await employee.save();
    console.log('Employee seeded: EMP0001');

    const employeeUser = new User({
      email: 'test.employee@gmail.com',
      role: 'employee',
    });
    await employeeUser.save();
    console.log('Employee user seeded: test.employee@gmail.com');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('MongoDB server is not running. Please start MongoDB using "mongod" and try again.');
    }
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
};

seed();