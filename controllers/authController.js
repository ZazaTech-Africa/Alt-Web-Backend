const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Send token response
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

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
    });

    // Generate email verification code
    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Send verification email
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

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
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

    const { email, code } = req.body;

    // Hash the provided code
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      emailVerificationCode: hashedCode,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;

    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Email verified successfully! Welcome to SHARPERLY!");
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification code
    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">Email Verification</h1>
        <p>Your new email verification code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; padding: 15px; border: 2px solid #dc2626; border-radius: 8px;">${verificationCode}</span>
        </div>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "SHARPERLY - New Verification Code",
      html: message,
    });

    res.status(200).json({
      success: true,
      message: "New verification code sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending verification code",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email address before logging in.",
        requiresEmailVerification: true,
      });
    }

    // Update last login
    await user.updateLastLogin();

    sendTokenResponse(user, 200, res, "Login successful! Welcome back to SHARPERLY!");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

// @desc    Forgot password - send reset code
// @route   POST /api/auth/forgot-password
// @access  Public
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

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    // Generate reset code
    const resetCode = user.generatePasswordResetCode();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">Password Reset Request</h1>
        <p>You have requested a password reset for your SHARPERLY account.</p>
        <p>Your password reset code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; padding: 15px; border: 2px solid #dc2626; border-radius: 8px;">${resetCode}</span>
        </div>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">SHARPERLY - The Dispatch Giant of Africa</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "SHARPERLY - Password Reset Code",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: "Password reset code sent to your email successfully",
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      user.passwordResetCode = undefined;
      user.passwordResetExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset request",
    });
  }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
// @access  Public
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

    // Hash the provided code
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully. You can now set a new password.",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during code verification",
    });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
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

    const { email, code, password } = req.body;

    // Hash the provided code
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successful! You are now logged in.");
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  try {
    await req.user.updateLastLogin();
    
    const token = generateToken(req.user._id);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
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

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password updated successfully");
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password",
    });
  }
};
