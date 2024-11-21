require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendResetCode = async (to, resetCode) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Password Reset Code for GMPlay',
    text: `
      Hello,

      You requested a password reset for your GMPlay account. Here is your password reset code:
      
      Code: ${resetCode}
      
      This code is valid for the next 5 minutes. Please enter this code on the password reset page within this timeframe. After 5 minutes, the code will expire and you'll need to request a new one.

      If you did not request a password reset, please ignore this email or contact support if you have concerns.

      Best regards,
      The GMPlay Team
    `
  };

  await transporter.sendMail(mailOptions);
};
