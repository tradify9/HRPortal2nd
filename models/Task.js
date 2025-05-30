const mongoose = require('mongoose');

   const taskSchema = new mongoose.Schema({
     employeeId: { type: String, required: true },
     title: { type: String, required: true },
     description: { type: String, required: true },
     status: { type: String, enum: ['assigned', 'in-progress', 'completed'], default: 'assigned' },
     createdAt: { type: Date, default: Date.now },
   });

   module.exports = mongoose.model('Task', taskSchema);