const Leave = require('../models/Leave');
   const Employee = require('../models/Employee');
   const { sendEmail } = require('../utils/sendEmail');

   // Submit a leave request (Employee)
   exports.submitLeave = async (req, res) => {
     const { startDate, endDate, reason } = req.body;
     const employeeId = req.user.employeeId; // From JWT

     try {
       if (!startDate || !endDate || !reason) {
         console.log('Submit Leave: Missing fields', { employeeId, startDate, endDate, reason });
         return res.status(400).json({ msg: 'All fields are required' });
       }

       const employee = await Employee.findOne({ employeeId });
       if (!employee) {
         console.log('Submit Leave: Employee not found', { employeeId });
         return res.status(404).json({ msg: 'Employee not found' });
       }

       const leave = new Leave({
         employeeId,
         startDate,
         endDate,
         reason,
         status: 'pending',
       });

       await leave.save();
       console.log('Submit Leave: Leave request created', { employeeId, leaveId: leave._id });

       // Send notification to admin (optional, non-critical)
       try {
         await sendEmail(
           process.env.EMAIL_USER, // Admin email
           'New Leave Request',
           `Employee ${employeeId} submitted a leave request from ${startDate} to ${endDate}. Reason: ${reason}`
         );
       } catch (emailError) {
         console.log('Submit Leave: Email notification failed', { employeeId, error: emailError.message });
         // Continue despite email failure
       }

       res.json({ msg: 'Leave request submitted successfully' });
     } catch (error) {
       console.error('Submit Leave error:', { employeeId, error: error.message });
       res.status(500).json({ msg: 'Server error: ' + error.message });
     }
   };

   // Approve or reject a leave request (Admin)
   exports.approveLeave = async (req, res) => {
     const { leaveId } = req.params;
     const { status } = req.body; // 'approved' or 'rejected'

     try {
       if (!['approved', 'rejected'].includes(status)) {
         console.log('Approve Leave: Invalid status', { leaveId, status });
         return res.status(400).json({ msg: 'Invalid status' });
       }

       const leave = await Leave.findById(leaveId);
       if (!leave) {
         console.log('Approve Leave: Leave not found', { leaveId });
         return res.status(404).json({ msg: 'Leave request not found' });
       }

       leave.status = status;
       await leave.save();
       console.log('Approve Leave: Leave updated', { leaveId, status });

       // Send notification to employee (non-critical)
       const employee = await Employee.findOne({ employeeId: leave.employeeId });
       if (employee && employee.email) {
         try {
           await sendEmail(
             employee.email,
             `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
             `Your leave request from ${leave.startDate} to ${leave.endDate} has been ${status}.`
           );
         } catch (emailError) {
           console.log('Approve Leave: Email notification failed', { leaveId, employeeId: leave.employeeId, error: emailError.message });
           // Continue despite email failure
         }
       }

       res.json({ msg: `Leave request ${status} successfully` });
     } catch (error) {
       console.error('Approve Leave error:', { leaveId, error: error.message });
       res.status(500).json({ msg: 'Server error: ' + error.message });
     }
   };

   // Get all leave requests (Admin or Employee)
   exports.getLeaves = async (req, res) => {
     try {
       const employeeId = req.user.employeeId;
       const role = req.user.role;

       let leaves;
       if (role === 'admin') {
         leaves = await Leave.find();
       } else {
         leaves = await Leave.find({ employeeId });
       }

       res.json(leaves);
     } catch (error) {
       console.error('Get Leaves error:', { employeeId, error: error.message });
       res.status(500).json({ msg: 'Server error: ' + error.message });
     }
   };