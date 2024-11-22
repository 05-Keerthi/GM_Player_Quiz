require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to GM Play!",
    text: `Hi ${username},
           
           Thank you for registering at GM Play!
           
           You can now log in and enjoy our services.

           If you have any questions or need assistance, don't hesitate to contact our support team.

           
           Best regards,
           GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};

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

exports.sendPasswordResetConfirmation = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Changed Successfully for GMPlay ',
    text: `Hi ${username},
    
           Your password has been successfully changed. If you did not perform this action, please contact our support team immediately.
           
           Best regards,
           GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};