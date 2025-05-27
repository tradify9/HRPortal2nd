const Attendance = require('../models/Attendance');
const { Parser } = require('json2csv');

exports.punchIn = async (req, res) => {
  try {
    const email = req.user.email;
    const today = new Date().toISOString().split('T')[0];

    const existingRecord = await Attendance.findOne({ email, date: today });
    if (existingRecord && existingRecord.punchIn) {
      console.log('Punch-in: Already punched in', { email, date: today });
      return res.status(400).json({ msg: 'Already punched in today' });
    }

    const attendance = new Attendance({
      email,
      date: today,
      status: 'H',
      punchIn: new Date(),
    });

    await attendance.save();
    console.log('Punch-in: Success', { email, date: today });
    res.json({ msg: 'Punch-in successful' });
  } catch (error) {
    console.error('Punch-in error:', { email: req.user.email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const email = req.user.email;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ email, date: today });
    if (!attendance || !attendance.punchIn) {
      console.log('Punch-out: Not punched in', { email, date: today });
      return res.status(400).json({ msg: 'You have not punched in today' });
    }

    if (attendance.punchOut) {
      console.log('Punch-out: Already punched out', { email, date: today });
      return res.status(400).json({ msg: 'Already punched out today' });
    }

    attendance.punchOut = new Date();
    attendance.status = 'P';
    await attendance.save();

    console.log('Punch-out: Success', { email, date: today });
    res.json({ msg: 'Punch-out successful' });
  } catch (error) {
    console.error('Punch-out error:', { email: req.user.email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.getEmployeeAttendance = async (req, res) => {
  try {
    const email = req.user.email;
    const attendance = await Attendance.find({ email }).sort({ date: -1 });
    console.log('Get employee attendance: Success', { email, count: attendance.length });
    res.json(attendance);
  } catch (error) {
    console.error('Get employee attendance error:', { email: req.user.email, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ date: -1 });
    console.log('Get all attendance: Success', { count: attendance.length });
    res.json(attendance);
  } catch (error) {
    console.error('Get all attendance error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.downloadAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      console.log('Download attendance: Missing date parameters');
      return res.status(400).json({ msg: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      console.log('Download attendance: Invalid date format');
      return res.status(400).json({ msg: 'Invalid date format' });
    }

    if (start > end) {
      console.log('Download attendance: Invalid date range');
      return res.status(400).json({ msg: 'Start date must be before end date' });
    }

    const attendance = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });

    if (!attendance.length) {
      console.log('Download attendance: No records found');
      return res.status(404).json({ msg: 'No attendance records found' });
    }

    const fields = [
      { label: 'Email', value: 'email' },
      { label: 'Date', value: 'date' },
      { label: 'Status', value: 'status' },
      {
        label: 'Punch In',
        value: (row) => (row.punchIn ? new Date(row.punchIn).toLocaleTimeString() : '-'),
      },
      {
        label: 'Punch Out',
        value: (row) => (row.punchOut ? new Date(row.punchOut).toLocaleTimeString() : '-'),
      },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(attendance);

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_${startDate}_${endDate}.csv`);
    console.log('Download attendance: Success', { count: attendance.length });
    res.send(csv);
  } catch (error) {
    console.error('Download attendance error:', error.message);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};