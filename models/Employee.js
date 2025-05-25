const mongoose = require('mongoose');

   const employeeSchema = new mongoose.Schema({
     employeeId: { type: String, required: true, unique: true },
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     position: { type: String, required: true },
     salary: { type: Number, required: true },
   });

   module.exports = mongoose.model('Employee', employeeSchema);