const User = require("../models/User");
const Business = require("../models/Business");
const { validationResult } = require("express-validator");
const cloudinary = require("../config/cloudinary");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const business = await Business.findOne({ user: req.user.id });

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
        skippedCorporateInfo: user.skippedCorporateInfo,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      business: business || null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const fieldsToUpdate = {
      fullName: req.body.fullName,
      email: req.body.email,
      about: req.body.about,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Check if email is being changed and if it already exists
    if (fieldsToUpdate.email) {
      const existingUser = await User.findOne({ 
        email: fieldsToUpdate.email,
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // If email is changed, mark as unverified
      fieldsToUpdate.isEmailVerified = false;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile-image
// @access  Private
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "sharperly/profile-images",
      width: 300,
      height: 300,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });

    // Update user profile image
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile image",
    });
  }
};

// @desc    Skip corporate info
// @route   PUT /api/users/skip-corporate-info
// @access  Private
exports.skipCorporateInfo = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      skippedCorporateInfo: true,
    });

    res.status(200).json({
      success: true,
      message: "Corporate info skipped successfully",
    });
  } catch (error) {
    console.error("Skip corporate info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while skipping corporate info",
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    // Delete related business and vehicle data
    await Business.findOneAndDelete({ user: req.user.id });
    await Vehicle.findOneAndDelete({ user: req.user.id });
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const business = await Business.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      user,
      business: business || null,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user status",
    });
  }
};
