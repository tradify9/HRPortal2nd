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
});

module.exports = mongoose.model('User', userSchema);