const Employee = require('../models/Employee');

const generateEmployeeId = async () => {
  try {
    let isUnique = false;
    let employeeId;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops

    while (!isUnique && attempts < maxAttempts) {
      // Generate a random number between 1 and 9999
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      employeeId = `TRD${randomNum.toString().padStart(4, '0')}`; // e.g., EMP0001

      // Check if employeeId exists
      const existingEmployee = await Employee.findOne({ employeeId });
      if (!existingEmployee) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique employee ID after maximum attempts');
    }

    console.log('Generated unique employeeId:', employeeId);
    return employeeId;
  } catch (error) {
    console.error('Generate Employee ID error:', error.message);
    throw error;
  }
};

module.exports = { generateEmployeeId };