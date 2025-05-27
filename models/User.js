const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return this.role === 'admin';
    },
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
  },
  name: {
    type: String,
    default: function () {
      return this.role === 'admin' ? 'Admin' : 'Test Employee';
    },
  },
  employeeId: {
    type: String,
    unique: true,
    default: function () {
      return this.role === 'employee' ? `TRD-${Date.now()}` : undefined;
    },
  },
});

module.exports = mongoose.model('User', userSchema);