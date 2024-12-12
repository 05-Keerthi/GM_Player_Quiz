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

exports.sendPasswordChangeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Changed Successfully",
    text: `Hi ${username},

           Your password has been successfully changed.

           If you did not make this change, please contact our support team immediately.

           Best regards,
           GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendInviteEmail = async (email, name, inviteLink, credentials) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Welcome to ${name} as Admin`,
    text: `Hi ${credentials.username},

      You have been invited to join ${name} as the admin.

      Here are your credentials:
      - Username: ${credentials.username}
      - Email: ${credentials.email}
      - Password: ${credentials.password}

      Please use the link below to complete your registration and access your dashboard:
      ${inviteLink}

      We recommend changing your password immediately after logging in for security purposes.

      If you have any questions or need assistance, feel free to contact our support team.

      Best regards,
      GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendQuizInvitationMail = async (email, username, quizTitle, joinCode) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Invitation to Join the "${quizTitle}" Quiz!`,
    text: `Hi ${username},

           You are invited to join the quiz session for "${quizTitle}"!

           To join the quiz, please use the following join code: ${joinCode}.

           If you have not yet joined, please make sure to use the code and participate in the quiz.

           Best regards,
           GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};


exports.sendQuizSessionUpdateMail = async (email, username, quizTitle) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Quiz Session Update: "${quizTitle}"`,
    text: `Hello ${username},

"This is a reminder that the quiz session for "${quizTitle}" has started. If you have not yet joined, you won't be able to participate."

Best regards,
The GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendQuizResultMail = async (email, username, quizTitle, score, rank) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Quiz Result for "${quizTitle}"`,
    text: `Hello ${username},

Your quiz result for the "${quizTitle}" quiz is ready! Here are the details:

Score: ${score}
Rank: ${rank || 'N/A'}

Thank you for participating in the quiz!

Best regards,
The GM Play Team`,
  };

  return transporter.sendMail(mailOptions);
};