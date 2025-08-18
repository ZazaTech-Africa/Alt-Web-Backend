const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  user.password = undefined;

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        hasCompletedKYC: user.hasCompletedKYC,
        hasCompletedVehicleRegistration: user.hasCompletedVehicleRegistration,
        lastLogin: user.lastLogin,
      },
    });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      isEmailVerified: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    });

    const token = generateToken(user._id);

    if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
      return sendTokenResponse(user, 201, res, "Registration successful! (Development mode - email verification skipped)");
    }

    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    try {
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Welcome to SHARPERLY!</h1>
          <p>Thank you for registering with SHARPERLY - The Dispatch Giant of Africa.</p>
          <p>Your email verification code is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; padding: 15px; border: 2px solid #dc2626; border-radius: 8px;">${verificationCode}</span>
          </div>
          <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">SHARPERLY - The Dispatch Giant of Africa</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: "SHARPERLY - Verify Your Email Address",
        html: message,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful! Please check your email for the verification code.",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      res.status(201).json({
        success: true,
        message: "Registration successful, but verification email could not be sent. Please contact support.",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { verificationCode } = req.body;
    const userId = req.user.id;

    const hashedCode = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    const user = await User.findOne({
      _id: userId,
      emailVerificationCode: hashedCode,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Email verified successfully! Welcome to SHARPERLY!");
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};


exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">SHARPERLY - Resend Verification Code</h1>
        <p>You requested to resend your email verification code. Here is your new code:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; padding: 15px; border: 2px solid #dc2626; border-radius: 8px;">${verificationCode}</span>
        </div>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">SHARPERLY - The Dispatch Giant of Africa</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "SHARPERLY - Your New Email Verification Code",
      html: message,
    });

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending verification code.",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email.",
      });
    }

    const resetCode = user.generatePasswordResetCode();
    await user.save({ validateBeforeSave: false });

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">SHARPERLY - Password Reset</h1>
        <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
        <p>Your password reset code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; padding: 15px; border: 2px solid #dc2626; border-radius: 8px;">${resetCode}</span>
        </div>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">SHARPERLY - The Dispatch Giant of Africa</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "SHARPERLY - Password Reset Request",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: "Password reset code sent to your email.",
      });
    } catch (error) {
      console.error("Password reset email failed:", error);
      user.passwordResetCode = undefined;
      user.passwordResetExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during forgot password request.",
    });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, code } = req.body;

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully. You can now reset your password.",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during reset code verification.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, code, password, confirmPassword } = req.body;

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successfully! You are now logged in.");
  }
  catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset.",
    });
  }
};

exports.googleCallback = (req, res) => {
  sendTokenResponse(req.user, 200, res, "Google login successful!");
};

exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password updated successfully!");
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password.",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        about: user.about,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        hasCompletedKYC: user.hasCompletedKYC,
        hasCompletedVehicleRegistration: user.hasCompletedVehicleRegistration,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user data",
    });
  }
};
