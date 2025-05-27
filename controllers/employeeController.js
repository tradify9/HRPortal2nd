const Employee = require('../models/Employee');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const { generateEmployeeId } = require('../utils/generateEmployeeId');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');

exports.addEmployee = async (req, res) => {
  const { name, email, position, salary } = req.body;

  try {
    if (!name || !email || !position || !salary) {
      console.log('Add Employee: Missing fields', { name, email, position, salary });
      return res.status(400).json({ msg: 'All fields are required' });
    }

    let employee = await Employee.findOne({ email });
    if (employee) {
      console.log('Add Employee: Email already exists', { email });
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const employeeId = await generateEmployeeId();
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    employee = new Employee({
      employeeId,
      name,
      email,
      position,
      salary,
    });

    const user = new User({
      employeeId,
      password: hashedPassword,
      role: 'employee',
    });

    await employee.save();
    await user.save();
    console.log('Add Employee: Employee and user created', { employeeId, email });

    try {
      await sendEmail(
        email,
        'Welcome to Fintradify HR Portal',
        `Your account has been created please login the link to used your employee id and password. Employee ID: ${employeeId}, Password: ${password}`
      );
      console.log('Add Employee: Welcome email sent', { email });
    } catch (emailError) {
      console.log('Add Employee: Email sending failed', { email, error: emailError.message });
      return res.json({ msg: 'Employee added successfully, but email sending failed' });
    }

    res.json({ msg: 'Employee added successfully' });
  } catch (error) {
    console.error('Add Employee error:', { email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.uploadEmployeesCSV = async (req, res) => {
  if (!req.file) {
    console.log('Upload Employees CSV: No file uploaded');
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (const row of results) {
        const { name, email, position, salary } = row;

        if (!name || !email || !position || !salary) {
          errors.push(`Missing fields for ${email || 'unknown'}`);
          continue;
        }

        try {
          let employee = await Employee.findOne({ email });
          if (employee) {
            errors.push(`Email already exists: ${email}`);
            continue;
          }

          const employeeId = await generateEmployeeId();
          const password = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(password, 10);

          employee = new Employee({
            employeeId,
            name,
            email,
            position,
            salary: parseFloat(salary),
          });

          const user = new User({
            employeeId,
            password: hashedPassword,
            role: 'employee',
          });

          await employee.save();
          await user.save();
          console.log('Upload Employees CSV: Employee added', { employeeId, email });

          try {
            await sendEmail(
              email,
              'Welcome to HR Portal',
              `Your account has been created. Employee ID: ${employeeId}, Password: ${password}`
            );
          } catch (emailError) {
            console.log('Upload Employees CSV: Email sending failed', { email, error: emailError.message });
            errors.push(`Email sending failed for ${email}`);
          }
        } catch (error) {
          console.error('Upload Employees CSV: Error adding employee', { email, error: error.message });
          errors.push(`Error adding ${email}: ${error.message}`);
        }
      }

      fs.unlinkSync(req.file.path); // Clean up
      res.json({
        msg: `CSV processed. ${results.length - errors.length} employees added successfully.`,
        errors,
      });
    })
    .on('error', (error) => {
      console.error('Upload Employees CSV: CSV parsing error', error.message);
      res.status(500).json({ msg: 'Error parsing CSV: ' + error.message });
    });
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    console.error('Get Employees error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      console.log('Delete Employee: Employee not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    await Employee.findByIdAndDelete(req.params.id);
    await User.findOneAndDelete({ employeeId: employee.employeeId });
    console.log('Delete Employee: Employee deleted', { employeeId: employee.employeeId });
    res.json({ msg: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete Employee error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      console.log('Get employee by ID: Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }
    console.log('Get employee by ID: Success', { id: req.params.id, employeeId: employee.employeeId });
    res.json(employee);
  } catch (error) {
    console.error('Get employee by ID error:', { id: req.params.id, error: error.message });
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  const { name, email, position, salary } = req.body;

  try {
    if (!name || !email || !position || !salary) {
      console.log('Update Employee: Missing fields', { name, email, position, salary });
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      console.log('Update Employee: Employee not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Check if email is changed and already exists for another employee
    if (email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        console.log('Update Employee: Email already exists', { email });
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    employee.name = name;
    employee.email = email;
    employee.position = position;
    employee.salary = parseFloat(salary);

    await employee.save();
    console.log('Update Employee: Success', { id: req.params.id, employeeId: employee.employeeId });
    res.json({ msg: 'Employee updated successfully', employee });
  } catch (error) {
    console.error('Update Employee error:', { id: req.params.id, error: error.message });
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};