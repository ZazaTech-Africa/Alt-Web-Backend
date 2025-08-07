const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "driver", "admin"],
    default: "user",
  },
  profileImage: {
    type: String,
    default: null,
  },
  about: {
    type: String,
    maxlength: [500, "About section cannot exceed 500 characters"],
  },
  
  // Account status
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Onboarding status
  hasCompletedOnboarding: {
    type: Boolean,
    default: false,
  },
  skippedCorporateInfo: {
    type: Boolean,
    default: false,
  },
  hasCompletedKYC: {
    type: Boolean,
    default: false,
  },
  hasCompletedVehicleRegistration: {
    type: Boolean,
    default: false,
  },
  
  // Email verification
  emailVerificationCode: String,
  emailVerificationExpire: Date,
  
  // Password reset
  passwordResetCode: String,
  passwordResetExpire: Date,
  
  // Google OAuth
  googleId: String,
  
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ emailVerificationCode: 1 });
userSchema.index({ passwordResetCode: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate 6-digit verification code
userSchema.methods.generateEmailVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.emailVerificationCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  
  this.emailVerificationExpire = Date.now() + (process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;
  
  return code;
};

// Generate 6-digit password reset code
userSchema.methods.generatePasswordResetCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.passwordResetCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  
  this.passwordResetExpire = Date.now() + (process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;
  
  return code;
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model("User", userSchema);
