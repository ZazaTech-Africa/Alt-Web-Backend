const Business = require("../models/Business");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const cloudinary = require("../config/cloudinary");
const fileHandler = require("../utils/fileHandler");

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

    let proofOfAddressUrl = null;
    let businessLogoUrl = null;
    
    console.log('Body received:', req.body);
    
    // Handle base64 encoded files
    if (req.body.proofOfAddressBase64) {
      try {
        proofOfAddressUrl = await fileHandler.processBase64AndUpload(
          req.body.proofOfAddressBase64,
          "sharperly/proof-of-address"
        );
        console.log('Proof of address uploaded successfully:', proofOfAddressUrl);
      } catch (error) {
        console.error('Error uploading proof of address:', error);
        return res.status(400).json({
          success: false,
          message: "Error processing proof of address file",
        });
      }
    }
    
    if (req.body.businessLogoBase64) {
      try {
        businessLogoUrl = await fileHandler.processBase64AndUpload(
          req.body.businessLogoBase64,
          "sharperly/business-logos"
        );
        console.log('Business logo uploaded successfully:', businessLogoUrl);
      } catch (error) {
        console.error('Error uploading business logo:', error);
        return res.status(400).json({
          success: false,
          message: "Error processing business logo file",
        });
      }
    }
    
    // For backward compatibility - handle multipart form data if base64 is not used
    if ((!proofOfAddressUrl || !businessLogoUrl) && (req.files || req.file)) {
      console.log('Files received:', req.files);
      console.log('File received:', req.file);
      
      // Handle both multiple files (req.files) and single file (req.file) scenarios
      if (req.files || req.file) {
        // Handle proof of address file if req.files exists
        if (!proofOfAddressUrl && req.files && req.files.proofOfAddress && req.files.proofOfAddress[0]) {
          const proofResult = await cloudinary.uploader.upload(req.files.proofOfAddress[0].path, {
            folder: "sharperly/proof-of-address",
            resource_type: "auto",
          });
          proofOfAddressUrl = proofResult.secure_url;
        }
        
        // Handle business logo file if req.files exists
        if (!businessLogoUrl && req.files && req.files.businessLogo && req.files.businessLogo[0]) {
          const result = await cloudinary.uploader.upload(req.files.businessLogo[0].path, {
            folder: "sharperly/business-logos",
            resource_type: "image",
          });
          businessLogoUrl = result.secure_url;
        }
        
        // Handle generic file upload (for compatibility with different field names)
        if (req.files) {
          const fileKeys = Object.keys(req.files);
          for (const key of fileKeys) {
            if (key !== 'proofOfAddress' && key !== 'businessLogo' && req.files[key][0]) {
              const file = req.files[key][0];
              // Determine if this is likely a proof of address or business logo based on mimetype
              if (!proofOfAddressUrl && (file.mimetype === 'application/pdf' || file.mimetype.includes('document'))) {
                const proofResult = await cloudinary.uploader.upload(file.path, {
                  folder: "sharperly/proof-of-address",
                  resource_type: "auto",
                });
                proofOfAddressUrl = proofResult.secure_url;
              } else if (!businessLogoUrl && file.mimetype.startsWith('image/')) {
                const result = await cloudinary.uploader.upload(file.path, {
                  folder: "sharperly/business-logos",
                  resource_type: "image",
                });
                businessLogoUrl = result.secure_url;
              }
            }
          }
        }
        
        // Handle single file upload case
        if (req.file) {
          const file = req.file;
          // Determine if this is likely a proof of address or business logo based on mimetype
          if (!proofOfAddressUrl && (file.mimetype === 'application/pdf' || file.mimetype.includes('document'))) {
            const proofResult = await cloudinary.uploader.upload(file.path, {
              folder: "sharperly/proof-of-address",
              resource_type: "auto",
            });
            proofOfAddressUrl = proofResult.secure_url;
          } else if (!businessLogoUrl && file.mimetype.startsWith('image/')) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "sharperly/business-logos",
              resource_type: "image",
            });
            businessLogoUrl = result.secure_url;
          }
        }
      }
    }

    const {
      businessName,
      businessEmail,
      businessStreet,
      businessCity,
      businessState,
      businessCountry,
      businessZipCode,
      cacRegistrationNumber,
      businessHotline,
      alternativePhoneNumber,
      wantSharperlyDriverOrders,
    } = req.body;

    const business = await Business.create({
      user: req.user.id,
      businessName,
      businessEmail,
      businessStreet,
      businessCity,
      businessState,
      businessCountry,
      businessZipCode,
      cacRegistrationNumber,
      proofOfAddress: proofOfAddressUrl || "pending-upload",
      businessLogo: businessLogoUrl,
      businessHotline,
      alternativePhoneNumber,
      wantSharperlyDriverOrders: wantSharperlyDriverOrders === 'true',
    });

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

    if (req.files) {
      // Handle proof of address file
      if (req.files.proofOfAddress && req.files.proofOfAddress[0]) {
        const proofResult = await cloudinary.uploader.upload(req.files.proofOfAddress[0].path, {
          folder: "sharperly/proof-of-address",
          resource_type: "auto",
        });
        updateData.proofOfAddress = proofResult.secure_url;
      }
      
      // Handle business logo file
      if (req.files.businessLogo && req.files.businessLogo[0]) {
        const logoResult = await cloudinary.uploader.upload(req.files.businessLogo[0].path, {
          folder: "sharperly/business-logos",
          resource_type: "image",
        });
        updateData.businessLogo = logoResult.secure_url;
      }
    }

    // No need to parse address fields as they are now individual strings

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

    const business = await Business.findOne({ user: req.user.id });
    if (!business) {
      return res.status(400).json({
        success: false,
        message: "Please complete business KYC first",
      });
    }

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

    const vehicles = await Vehicle.create({
      user: req.user.id,
      business: business._id,
      numberOfDrivers,
      numberOfCars,
      numberOfBikes,
      numberOfVans,
    });

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
