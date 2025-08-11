const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Driver full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Driver email is required"],
    unique: true, 
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
  },
  profileImage: String,
  licenseNumber: {
    type: String,
    required: [true, "License number is required"],
    unique: true, 
  },
  licenseExpiry: {
    type: Date,
    required: [true, "License expiry date is required"],
  },
  vehicleType: {
    type: String,
    enum: ["car", "bike", "van"],
    required: [true, "Vehicle type is required"],
  },
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    plateNumber: {
      type: String,
      required: [true, "Vehicle plate number is required"],
      unique: true,
    },
    color: String,
  },
  currentLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  completedDeliveries: {
    type: Number,
    default: 0,
  },
  cancelledDeliveries: {
    type: Number,
    default: 0,
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
}, {
  timestamps: true,
});

driverSchema.index({ vehicleType: 1 });
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ isVerified: 1 });
driverSchema.index({ rating: -1 });

module.exports = mongoose.model("Driver", driverSchema);