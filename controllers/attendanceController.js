const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

exports.getEmployeeAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      console.log('Get attendance: Missing employeeId', { user: req.user });
      return res.status(401).json({ msg: 'Unauthorized: Missing employee ID' });
    }
    const attendance = await Attendance.find({ employeeId }).sort({ date: -1 });
    console.log('Get attendance:', { employeeId, count: attendance.length });
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', { employeeId: req.user?.employeeId || 'unknown', error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.punchIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log('Punch-in: Employee not found', { employeeId });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      console.log('Punch-in: Already punched in', { employeeId, date });
      return res.status(400).json({ msg: 'Already punched in today' });
    }

    const status = now.getHours() >= 12 ? 'H' : 'P';
    const attendance = new Attendance({
      employeeId,
      date,
      status,
      punchIn: now,
    });
    await attendance.save();
    console.log('Punch-in: Success', { employeeId, date, status });
    res.json({ msg: 'Punch-in successful', status });
  } catch (error) {
    console.error('Punch-in error:', { employeeId: req.user.employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const date = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId, date });
    if (!attendance) {
      console.log('Punch-out: No punch-in found', { employeeId, date });
      return res.status(400).json({ msg: 'No punch-in found for today' });
    }
    if (attendance.punchOut) {
      console.log('Punch-out: Already punched out', { employeeId, date });
      return res.status(400).json({ msg: 'Already punched out today' });
    }

    attendance.punchOut = new Date();
    await attendance.save();
    console.log('Punch-out: Success', { employeeId, date });
    res.json({ msg: 'Punch-out successful' });
  } catch (error) {
    console.error('Punch-out error:', { employeeId: req.user.employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.downloadAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      console.log('Download attendance: Missing dates');
      return res.status(400).json({ msg: 'Start date and end date are required' });
    }

    const employees = await Employee.find();
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Punch In', key: 'punchIn', width: 15 },
      { header: 'Punch Out', key: 'punchOut', width: 15 },
    ];

    employees.forEach((employee) => {
      const employeeAttendance = attendance.filter((a) => a.employeeId === employee.employeeId);
      employeeAttendance.forEach((record) => {
        worksheet.addRow({
          employeeId: record.employeeId,
          name: employee.name,
          date: record.date,
          status: record.status === 'P' ? 'Present' : record.status === 'H' ? 'Half Day' : 'Absent',
          punchIn: record.punchIn ? new Date(record.punchIn).toLocaleTimeString() : '-',
          punchOut: record.punchOut ? new Date(record.punchOut).toLocaleTimeString() : '-',
        });
      });
    });

    const fileName = `attendance_${startDate}_${endDate}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download attendance error:', { error: err.message });
        res.status(500).json({ msg: 'Error downloading attendance' });
      }
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Download attendance error:', { error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log('Get all attendance: Unauthorized', { employeeId: req.user?.employeeId || 'unknown', role: req.user?.role || 'none' });
      return res.status(401).json({ msg: 'Unauthorized: Admin access required' });
    }
    const attendance = await Attendance.find();
    const employees = await Employee.find();
    console.log('Get all attendance: Success', { attendanceCount: attendance.length, employeeCount: employees.length });
    res.json({ attendance, employees });
  } catch (error) {
    console.error('Get all attendance error:', { employeeId: req.user?.employeeId || 'unknown', error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};