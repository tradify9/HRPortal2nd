const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Please use a valid Gmail address'], // Enforce Gmail only
  },
  password: {
    type: String,
    required: function() {
      return this.role === 'admin'; // Password required only for admins
    },
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);