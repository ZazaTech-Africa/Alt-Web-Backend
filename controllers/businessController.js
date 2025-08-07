const Business = require("../models/Business");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const cloudinary = require("../config/cloudinary");

// @desc    Submit business KYC
// @route   POST /api/business/kyc
// @access  Private
exports.submitKYC = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // For now, just store the filename instead of uploading to cloud
    let proofOfAddressUrl = null;
    if (req.file) {
      proofOfAddressUrl = `/uploads/${req.file.filename}`; // Local file path
    }

    const {
      businessName,
      businessEmail,
      businessAddress,
      cacRegistrationNumber,
      businessHotline,
      alternativePhoneNumber,
      wantSharperlyDriverOrders,
    } = req.body;

    // Create business without cloud upload
    const business = await Business.create({
      user: req.user.id,
      businessName,
      businessEmail,
      businessAddress: JSON.parse(businessAddress),
      cacRegistrationNumber,
      proofOfAddress: proofOfAddressUrl || "pending-upload",
      businessHotline,
      alternativePhoneNumber,
      wantSharperlyDriverOrders: wantSharperlyDriverOrders === 'true',
    });

    // Update user KYC status
    await User.findByIdAndUpdate(req.user.id, {
      hasCompletedKYC: true,
    });

    res.status(201).json({
      success: true,
      message: "Business KYC submitted successfully",
      business,
    });
  } catch (error) {
    console.error("Submit KYC error:", error);
    
    // Handle duplicate CAC number
    if (error.code === 11000 && error.keyPattern?.cacRegistrationNumber) {
      return res.status(400).json({
        success: false,
        message: "CAC registration number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during KYC submission",
    });
  }
};

// @desc    Get business KYC
// @route   GET /api/business/kyc
// @access  Private
exports.getKYC = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user.id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business KYC not found",
      });
    }

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    console.error("Get KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching KYC data",
    });
  }
};

// @desc    Update business KYC
// @route   PUT /api/business/kyc
// @access  Private
exports.updateKYC = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user.id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business KYC not found",
      });
    }

    const updateData = { ...req.body };

    // Handle proof of address update
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "sharperly/proof-of-address",
        resource_type: "auto",
      });
      updateData.proofOfAddress = result.secure_url;
    }

    // Parse business address if it's a string
    if (updateData.businessAddress && typeof updateData.businessAddress === 'string') {
      updateData.businessAddress = JSON.parse(updateData.businessAddress);
    }

    // Convert boolean string to boolean
    if (updateData.wantSharperlyDriverOrders) {
      updateData.wantSharperlyDriverOrders = updateData.wantSharperlyDriverOrders === 'true';
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      business._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Business KYC updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Update KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating KYC data",
    });
  }
};

// @desc    Register vehicles
// @route   POST /api/business/vehicles
// @access  Private
exports.registerVehicles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Check if business exists
    const business = await Business.findOne({ user: req.user.id });
    if (!business) {
      return res.status(400).json({
        success: false,
        message: "Please complete business KYC first",
      });
    }

    // Check if vehicles already registered
    const existingVehicles = await Vehicle.findOne({ user: req.user.id });
    if (existingVehicles) {
      return res.status(400).json({
        success: false,
        message: "Vehicles already registered. Use update endpoint to modify.",
      });
    }

    const {
      numberOfDrivers,
      numberOfCars,
      numberOfBikes,
      numberOfVans,
    } = req.body;

    // Create vehicle registration
    const vehicles = await Vehicle.create({
      user: req.user.id,
      business: business._id,
      numberOfDrivers,
      numberOfCars,
      numberOfBikes,
      numberOfVans,
    });

    // Update user vehicle registration status
    await User.findByIdAndUpdate(req.user.id, {
      hasCompletedVehicleRegistration: true,
    });

    res.status(201).json({
      success: true,
      message: "Vehicles registered successfully",
      vehicles,
    });
  } catch (error) {
    console.error("Register vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during vehicle registration",
    });
  }
};

// @desc    Get vehicles
// @route   GET /api/business/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findOne({ user: req.user.id })
      .populate("business", "businessName");

    if (!vehicles) {
      return res.status(404).json({
        success: false,
        message: "Vehicle registration not found",
      });
    }

    res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vehicle data",
    });
  }
};

// @desc    Update vehicles
// @route   PUT /api/business/vehicles
// @access  Private
exports.updateVehicles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const vehicles = await Vehicle.findOne({ user: req.user.id });

    if (!vehicles) {
      return res.status(404).json({
        success: false,
        message: "Vehicle registration not found",
      });
    }

    const {
      numberOfDrivers,
      numberOfCars,
      numberOfBikes,
      numberOfVans,
    } = req.body;

    const updatedVehicles = await Vehicle.findByIdAndUpdate(
      vehicles._id,
      {
        numberOfDrivers,
        numberOfCars,
        numberOfBikes,
        numberOfVans,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Vehicles updated successfully",
      vehicles: updatedVehicles,
    });
  } catch (error) {
    console.error("Update vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating vehicle data",
    });
  }
};

// @desc    Complete onboarding
// @route   PUT /api/business/complete-onboarding
// @access  Private
exports.completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.hasCompletedKYC || !user.hasCompletedVehicleRegistration) {
      return res.status(400).json({
        success: false,
        message: "Please complete KYC and vehicle registration first",
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      hasCompletedOnboarding: true,
    });

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while completing onboarding",
    });
  }
};
