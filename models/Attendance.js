const mongoose = require('mongoose');

  const attendanceSchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    date: { type: String, required: true },
    punchIn: { type: Date },
    punchOut: { type: Date },
    status: { type: String, enum: ['P', 'A', 'H'], default: 'A' },
    createdAt: { type: Date, default: Date.now },
  });

  module.exports = mongoose.model('Attendance', attendanceSchema);