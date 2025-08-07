const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  
  // Fleet information
  numberOfDrivers: {
    type: Number,
    required: [true, "Number of drivers is required"],
    min: [0, "Number of drivers cannot be negative"],
  },
  numberOfCars: {
    type: Number,
    required: [true, "Number of cars is required"],
    min: [0, "Number of cars cannot be negative"],
  },
  numberOfBikes: {
    type: Number,
    required: [true, "Number of bikes is required"],
    min: [0, "Number of bikes cannot be negative"],
  },
  numberOfVans: {
    type: Number,
    required: [true, "Number of vans is required"],
    min: [0, "Number of vans cannot be negative"],
  },
  
  // Calculated fields
  totalVehicles: {
    type: Number,
    default: 0,
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
}, {
  timestamps: true,
});

// Calculate total vehicles before saving
vehicleSchema.pre("save", function(next) {
  this.totalVehicles = this.numberOfCars + this.numberOfBikes + this.numberOfVans;
  next();
});

// Indexes
vehicleSchema.index({ user: 1 });
vehicleSchema.index({ business: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
