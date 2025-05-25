const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, attachments = []) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', { to, error: error.message, code: error.code, response: error.response });
    throw new Error('Email sending failed: ' + error.message);
  }
};

module.exports = { sendEmail };