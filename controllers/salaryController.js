const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const { sendEmail } = require('../utils/sendEmail');

exports.generateSalarySlip = async (req, res) => {
  const { employeeId, month, year } = req.body;

  try {
    if (!employeeId || !month || !year) {
      console.log('Generate Salary Slip: Missing fields', { employeeId, month, year });
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log('Generate Salary Slip: Employee not found', { employeeId });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fileName = `salary_slip_${employeeId}_${month}_${year}.pdf`;
    const filePath = path.join(__dirname, '../temp', fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Fonts
    doc.registerFont('Regular', 'Helvetica');
    doc.registerFont('Bold', 'Helvetica-Bold');

    // Company Header
    doc
      .font('Bold')
      .fontSize(20)
      .fillColor('#003087')
      .text('Fintradify Pvt. Ltd.', 40, 30)
      .fontSize(10)
      .fillColor('#333333')
      .text('123 Business Park, Financial District, Mumbai, MH 400001, India', 40, 55)
      .text('Email: hr@fintradify.com | Phone: +91 22 1234 5678')
      .moveDown(2);

    // Logo Placeholder (Comment for actual implementation)
    // doc.image('path/to/fintradify_logo.png', 400, 30, { width: 100, height: 50 });

    // Document Title
    doc
      .font('Bold')
      .fontSize(16)
      .fillColor('#003087')
      .text(`Pay Slip for ${month} ${year}`, { align: 'center' })
      .moveDown(1);

    // Employee Details Table
    doc
      .font('Bold')
      .fontSize(12)
      .fillColor('#333333')
      .text('Employee Details', 40, doc.y, { underline: true })
      .moveDown(0.5);

    const employeeDetails = [
      ['Employee ID', employee.employeeId],
      ['Name', employee.name],
      ['Position', employee.position],
      ['Department', employee.department || 'N/A'],
      ['PF Number', employee.pfNumber || 'N/A'],
      ['PAN', employee.pan || 'N/A']
    ];

    const tableTop = doc.y;
    const tableLeft = 40;
    const cellPadding = 5;
    const rowHeight = 20;
    const colWidths = [150, 350];

    employeeDetails.forEach((row, i) => {
      doc
        .font('Bold')
        .fontSize(10)
        .text(row[0], tableLeft, tableTop + i * rowHeight + cellPadding, { width: colWidths[0], align: 'left' })
        .font('Regular')
        .text(row[1], tableLeft + colWidths[0], tableTop + i * rowHeight + cellPadding, { width: colWidths[1], align: 'left' });

      // Draw row lines
      doc
        .lineWidth(0.5)
        .moveTo(tableLeft, tableTop + (i + 1) * rowHeight)
        .lineTo(tableLeft + colWidths[0] + colWidths[1], tableTop + (i + 1) * rowHeight)
        .stroke();
    });

    // Draw table borders
    doc
      .lineWidth(1)
      .rect(tableLeft, tableTop, colWidths[0] + colWidths[1], rowHeight * employeeDetails.length)
      .stroke();

    doc.moveDown(2);

    // Salary Details
    doc
      .font('Bold')
      .fontSize(12)
      .text('Earnings and Deductions', { underline: true })
      .moveDown(0.5);

    const basicSalary = employee.salary || 0;
    const allowances = 5000;
    const deductions = 2000;
    const netSalary = basicSalary + allowances - deductions;

    const salaryDetails = [
      ['Earnings', 'Amount (INR)'],
      ['Basic Salary', basicSalary.toFixed(2)],
      ['Allowances', allowances.toFixed(2)],
      ['Total Earnings', (basicSalary + allowances).toFixed(2)],
      ['', ''],
      ['Deductions', 'Amount (INR)'],
      ['Tax Deductions', deductions.toFixed(2)],
      ['Total Deductions', deductions.toFixed(2)],
      ['', ''],
      ['Net Salary', netSalary.toFixed(2)]
    ];

    const salaryTableTop = doc.y;
    const salaryColWidths = [300, 200];

    salaryDetails.forEach((row, i) => {
      const isHeader = row[0] === 'Earnings' || row[0] === 'Deductions';
      doc
        .font(isHeader ? 'Bold' : 'Regular')
        .fontSize(10)
        .text(row[0], tableLeft, salaryTableTop + i * rowHeight + cellPadding, { width: salaryColWidths[0], align: 'left' })
        .text(row[1], tableLeft + salaryColWidths[0], salaryTableTop + i * rowHeight + cellPadding, { width: salaryColWidths[1], align: 'right' });

      // Draw row lines for non-empty rows
      if (row[0] !== '') {
        doc
          .lineWidth(0.5)
          .moveTo(tableLeft, salaryTableTop + (i + 1) * rowHeight)
          .lineTo(tableLeft + salaryColWidths[0] + salaryColWidths[1], salaryTableTop + (i + 1) * rowHeight)
          .stroke();
      }
    });

    // Draw salary table borders
    doc
      .lineWidth(1)
      .rect(tableLeft, salaryTableTop, salaryColWidths[0] + salaryColWidths[1], rowHeight * (salaryDetails.length - 1))
      .stroke();

    // Watermark
    doc
      .font('Bold')
      .fontSize(50)
      .fillColor('#CCCCCC')
      .opacity(0.1)
      .text('FINTRADIFY', 100, 300, { rotate: 45 });

    // Footer
    doc
      .font('Regular')
      .fontSize(8)
      .fillColor('#333333')
      .opacity(1)
      .text('This is a system-generated document. No signature is required.', 40, doc.page.height - 60, { align: 'center' })
      .text('Fintradify Pvt. Ltd. | Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      console.log('Generate Salary Slip: PDF created', { employeeId, fileName });
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Generate Salary Slip: Download error', err.message);
          res.status(500).json({ msg: 'Error downloading PDF' });
        }
        fs.unlinkSync(filePath); // Clean up
      });
    });
  } catch (error) {
    console.error('Generate Salary Slip error:', { employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};

exports.emailSalarySlip = async (req, res) => {
  const { employeeId, month, year } = req.body;

  try {
    if (!employeeId || !month || !year) {
      console.log('Email Salary Slip: Missing fields', { employeeId, month, year });
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log('Email Salary Slip: Employee not found', { employeeId });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const fileName = `salary_slip_${employeeId}_${month}_${year}.pdf`;
    const filePath = path.join(__dirname, '../temp', fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Fonts
    doc.registerFont('Regular', 'Helvetica');
    doc.registerFont('Bold', 'Helvetica-Bold');

    // Company Header
    doc
      .font('Bold')
      .fontSize(20)
      .fillColor('#003087')
      .text('Fintradify Pvt. Ltd.', 40, 30)
      .fontSize(10)
      .fillColor('#333333')
      .text('C6, C Block, Sector 7, Noida, Uttar Pradesh 201301 India', 40, 55)
      .text('Email: hr@fintradify.com | Phone: +91 78360 09907')
      .moveDown(2);

    // Logo Placeholder (Comment for actual implementation)
    // doc.image('path/to/fintradify_logo.png', 400, 30, { width: 100, height: 50 });

    // Document Title
    doc
      .font('Bold')
      .fontSize(16)
      .fillColor('#003087')
      .text(`Pay Slip for ${month} ${year}`, { align: 'center' })
      .moveDown(1);

    // Employee Details Table
    const employeeDetails = [
      ['Employee ID', employee.employeeId],
      ['Name', employee.name],
      ['Position', employee.position],
      ['Department', employee.department || 'N/A'],
      ['PF Number', employee.pfNumber || 'N/A'],
      ['PAN', employee.pan || 'N/A']
    ];

    const tableTop = doc.y;
    const tableLeft = 40;
    const cellPadding = 5;
    const rowHeight = 20;
    const colWidths = [150, 350];

    employeeDetails.forEach((row, i) => {
      doc
        .font('Bold')
        .fontSize(10)
        .text(row[0], tableLeft, tableTop + i * rowHeight + cellPadding, { width: colWidths[0], align: 'left' })
        .font('Regular')
        .text(row[1], tableLeft + colWidths[0], tableTop + i * rowHeight + cellPadding, { width: colWidths[1], align: 'left' });

      // Draw row lines
      doc
        .lineWidth(0.5)
        .moveTo(tableLeft, tableTop + (i + 1) * rowHeight)
        .lineTo(tableLeft + colWidths[0] + colWidths[1], tableTop + (i + 1) * rowHeight)
        .stroke();
    });

    // Draw table borders
    doc
      .lineWidth(1)
      .rect(tableLeft, tableTop, colWidths[0] + colWidths[1], rowHeight * employeeDetails.length)
      .stroke();

    doc.moveDown(2);

    // Salary Details
    doc
      .font('Bold')
      .fontSize(12)
      .text('Earnings and Deductions', { underline: true })
      .moveDown(0.5);

    const basicSalary = employee.salary || 0;
    const allowances = 5000;
    const deductions = 2000;
    const netSalary = basicSalary + allowances - deductions;

    const salaryDetails = [
      ['Earnings', 'Amount (INR)'],
      ['Basic Salary', basicSalary.toFixed(2)],
      ['Allowances', allowances.toFixed(2)],
      ['Total Earnings', (basicSalary + allowances).toFixed(2)],
      ['', ''],
      ['Deductions', 'Amount (INR)'],
      ['Tax Deductions', deductions.toFixed(2)],
      ['Total Deductions', deductions.toFixed(2)],
      ['', ''],
      ['Net Salary', netSalary.toFixed(2)]
    ];

    const salaryTableTop = doc.y;
    const salaryColWidths = [300, 200];

    salaryDetails.forEach((row, i) => {
      const isHeader = row[0] === 'Earnings' || row[0] === 'Deductions';
      doc
        .font(isHeader ? 'Bold' : 'Regular')
        .fontSize(10)
        .text(row[0], tableLeft, salaryTableTop + i * rowHeight + cellPadding, { width: salaryColWidths[0], align: 'left' })
        .text(row[1], tableLeft + salaryColWidths[0], salaryTableTop + i * rowHeight + cellPadding, { width: salaryColWidths[1], align: 'right' });

      // Draw row lines for non-empty rows
      if (row[0] !== '') {
        doc
          .lineWidth(0.5)
          .moveTo(tableLeft, salaryTableTop + (i + 1) * rowHeight)
          .lineTo(tableLeft + salaryColWidths[0] + salaryColWidths[1], salaryTableTop + (i + 1) * rowHeight)
          .stroke();
      }
    });

    // Draw salary table borders
    doc
      .lineWidth(1)
      .rect(tableLeft, salaryTableTop, salaryColWidths[0] + salaryColWidths[1], rowHeight * (salaryDetails.length - 1))
      .stroke();

    // Watermark
    doc
      .font('Bold')
      .fontSize(50)
      .fillColor('#CCCCCC')
      .opacity(0.1)
      .text('FINTRADIFY', 100, 300, { rotate: 45 });

    // Footer
    doc
      .font('Regular')
      .fontSize(8)
      .fillColor('#333333')
      .opacity(1)
      .text('This is a system-generated document. No signature is required.', 40, doc.page.height - 60, { align: 'center' })
      .text('Fintradify . | Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });

    doc.end();

    stream.on('finish', async () => {
      try {
        await sendEmail(
          employee.email,
          `Salary Slip for ${month} ${year}`,
          'Dear ' + employee.name + ',\n\nPlease find attached your salary slip for ' + month + ' ' + year + '.\n\nBest regards,\nFintradify HR Team',
          [{ filename: fileName, path: filePath }]
        );
        console.log('Email Salary Slip: Email sent', { employeeId, email: employee.email });
        fs.unlinkSync(filePath); // Clean up
        res.json({ msg: 'Salary slip emailed successfully' });
      } catch (emailError) {
        console.log('Email Salary Slip: Email sending failed', { employeeId, error: emailError.message });
        fs.unlinkSync(filePath);
        res.json({ msg: 'Salary slip generated, but email sending failed' });
      }
    });
  } catch (error) {
    console.error('Email Salary Slip error:', { employeeId, error: error.message });
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
};