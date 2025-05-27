const Employee = require('../models/Employee');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const { generateEmployeeId } = require('../utils/generateEmployeeId');
const csv = require('csv-parser');
const fs = require('fs');

exports.addEmployee = async (req, res) => {
  const { name, email, position, salary } = req.body;

  try {
    if (!name || !email || !position || !salary) {
      console.log('Add Employee: Missing fields', { name, email, position, salary });
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (!email.endsWith('@gmail.com')) {
      console.log('Add Employee: Not a Gmail address', { email });
      return res.status(400).json({ msg: 'Please use a Gmail address' });
    }

    let employee = await Employee.findOne({ email });
    if (employee) {
      console.log('Add Employee: Email already exists', { email });
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const employeeId = await generateEmployeeId();

    employee = new Employee({
      employeeId,
      name,
      email,
      position,
      salary,
    });

    const user = new User({
      email,
      role: 'employee',
      name, // Sync name with Employee collection
      employeeId, // Sync employeeId with Employee collection
    });

    await employee.save();
    await user.save();
    console.log('Add Employee: Employee and user created', { employeeId, email });

    try {
      await sendEmail(
        email,
        'Welcome to HR Portal',
        `Your account has been created. Employee ID: ${employeeId}. You can log in using your email: ${email}.`
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

        if (!email.endsWith('@gmail.com')) {
          errors.push(`Not a Gmail address: ${email}`);
          continue;
        }

        try {
          let employee = await Employee.findOne({ email });
          if (employee) {
            errors.push(`Email already exists: ${email}`);
            continue;
          }

          const employeeId = await generateEmployeeId();

          employee = new Employee({
            employeeId,
            name,
            email,
            position,
            salary: parseFloat(salary),
          });

          const user = new User({
            email,
            role: 'employee',
            name, // Sync name with Employee collection
            employeeId, // Sync employeeId with Employee collection
          });

          await employee.save();
          await user.save();
          console.log('Upload Employees CSV: Employee added', { employeeId, email });

          try {
            await sendEmail(
              email,
              'Welcome to HR Portal',
              `Your account has been created. Employee ID: ${employeeId}. You can log in using your email: ${email}.`
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

      fs.unlinkSync(req.file.path);
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
    await User.findOneAndDelete({ email: employee.email });
    console.log('Delete Employee: Employee deleted', { email: employee.email });
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
    console.log('Get employee by ID: Success', { id: req.params.id, email: employee.email });
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

    if (!email.endsWith('@gmail.com')) {
      console.log('Update Employee: Not a Gmail address', { email });
      return res.status(400).json({ msg: 'Please use a Gmail address' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      console.log('Update Employee: Employee not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    if (email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        console.log('Update Employee: Email already exists', { email });
        return res.status(400).json({ msg: 'Email already exists' });
      }

      // Update the email in the User collection
      await User.findOneAndUpdate(
        { email: employee.email },
        { email },
        { new: true }
      );
    }

    employee.name = name;
    employee.email = email;
    employee.position = position;
    employee.salary = parseFloat(salary);

    await employee.save();
    console.log('Update Employee: Success', { id: req.params.id, email: employee.email });
    res.json({ msg: 'Employee updated successfully', employee });
  } catch (error) {
    console.error('Update Employee error:', { id: req.params.id, error: error.message });
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.getCurrentEmployee = async (req, res) => {
  try {
    console.log('Get current employee: Attempting to fetch', { email: req.user.email });
    let employee = await Employee.findOne({ email: req.user.email }).lean();
    
    if (!employee) {
      // If employee not found in Employee collection, check User collection
      const user = await User.findOne({ email: req.user.email }).lean();
      if (!user) {
        console.log('Get current employee: User not found', { email: req.user.email });
        return res.status(404).json({ msg: 'User not found' });
      }

      // Create a new Employee record if it doesn't exist
      const employeeId = await generateEmployeeId();
      employee = new Employee({
        employeeId,
        name: user.name || 'Test Employee', // Use name from User or default
        email: user.email,
        position: 'Employee', // Default position
        salary: 50000, // Default salary
      });

      await employee.save();
      console.log('Get current employee: Created new employee record', { email: req.user.email, employeeId });
    }

    const profile = {
      email: employee.email,
      name: employee.name,
      employeeId: employee.employeeId,
      position: employee.position,
      salary: employee.salary,
      role: 'employee',
    };
    console.log('Get current employee: Success', { email: req.user.email, name: employee.name });
    res.json(profile);
  } catch (error) {
    console.error('Get current employee error:', { email: req.user.email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};