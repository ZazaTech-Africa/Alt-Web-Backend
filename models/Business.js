const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  businessName: {
    type: String,
    required: [true, "Business name is required"],
    trim: true,
    maxlength: [200, "Business name cannot exceed 200 characters"],
  },
  businessEmail: {
    type: String,
    required: [true, "Business email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid business email"],
  },
  businessAddress: {
    street: {
      type: String,
      required: [true, "Street address is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      default: "Nigeria",
    },
    zipCode: String,
  },
  cacRegistrationNumber: {
    type: String,
    required: [true, "CAC registration number is required"],
    unique: true,
    trim: true,
  },
  proofOfAddress: {
    type: String, // Cloudinary URL
    required: [true, "Proof of address is required"],
  },
  businessHotline: {
    type: String,
    required: [true, "Business hotline is required"],
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
  },
  alternativePhoneNumber: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
  },
  wantSharperlyDriverOrders: {
    type: Boolean,
    required: [true, "Please specify if you want Sharperly to give your drivers orders"],
    default: false,
  },
  
  // Business verification status
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verificationNotes: String,
  
  // Business metrics
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  
}, {
  timestamps: true,
});

// Indexes
businessSchema.index({ user: 1 });
businessSchema.index({ cacRegistrationNumber: 1 });
businessSchema.index({ businessEmail: 1 });
businessSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model("Business", businessSchema);
