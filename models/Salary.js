const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  month: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  attendanceDays: { type: Number, required: true },
  leaveDays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Salary', salarySchema);