const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['P', 'A', 'H'],
    required: true,
  },
  punchIn: {
    type: Date,
  },
  punchOut: {
    type: Date,
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);