const Task = require('../models/Task');
   const Employee = require('../models/Employee');

   exports.assignTask = async (req, res) => {
     const { employeeId, title, description } = req.body;
     try {
       // Validate input
       if (!employeeId || !title || !description) {
         console.log('Assign Task: Missing required fields', { employeeId, title, description });
         return res.status(400).json({ msg: 'All fields are required' });
       }

       // Verify employee exists
       const employee = await Employee.findOne({ employeeId });
       if (!employee) {
         console.log('Assign Task: Employee not found', { employeeId });
         return res.status(404).json({ msg: 'Employee not found' });
       }

       // Create task
       const task = new Task({
         employeeId,
         title,
         description,
         status: 'assigned',
       });

       // Save to MongoDB
       await task.save();
       console.log('Assign Task: Success', { employeeId, title });
       res.status(200).json({ msg: 'Task assigned successfully', task });
     } catch (error) {
       console.error('Assign Task: Error', error.message, error.stack);
       res.status(500).json({ msg: 'Server error: ' + error.message });
     }
   };

   exports.getTasks = async (req, res) => {
     try {
       const tasks = await Task.find();
       res.json(tasks);
     } catch (error) {
       console.error('Error fetching tasks:', error.message);
       res.status(500).json({ msg: 'Server error' });
     }
   };

   exports.updateTaskStatus = async (req, res) => {
     const { status } = req.body;
     try {
       const task = await Task.findByIdAndUpdate(
         req.params.id,
         { status },
         { new: true }
       );
       if (!task) return res.status(404).json({ msg: 'Task not found' });
       res.json({ msg: 'Task status updated', task });
     } catch (error) {
       console.error('Error updating task:', error);
       res.status(500).json({ msg: 'Server error' });
     }
   };