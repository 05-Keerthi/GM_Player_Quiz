const User = require('../models/User');
const mailService = require('../services/mailService');

const generateResetCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetCode = generateResetCode();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // Expires in 5 minutes
    await user.save();

    await mailService.sendResetCode(email, resetCode);

    res.status(200).json({ message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  const { email, resetCode } = req.body;
  try {
    const user = await User.findOne({ 
      email,
      resetPasswordCode: resetCode, 
      resetPasswordExpires: { $gt: Date.now() } // Ensure code hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    res.status(200).json({ message: 'Reset code is valid' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordCode: resetCode,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure the reset code hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

   
   

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email to the user
    await mailService.sendPasswordResetConfirmation(user.email, user.username);

    res.status(200).json({ message: 'Password reset successful. Confirmation email sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

