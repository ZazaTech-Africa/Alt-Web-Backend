const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Business must be associated with a user"],
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
  businessStreet: {
    type: String,
    required: [true, "Street address is required"],
  },
  businessCity: {
    type: String,
    required: [true, "City is required"],
  },
  businessState: {
    type: String,
    required: [true, "State is required"],
  },
  businessCountry: {
    type: String,
    required: [true, "Country is required"],
    default: "Nigeria",
  },
  businessZipCode: {
    type: String,
  },
  cacRegistrationNumber: {
    type: String,
    required: [true, "CAC registration number is required"],
    unique: true,
    trim: true,
  },
  proofOfAddress: {
    type: String,
    required: [true, "Proof of address is required"],
  },
  businessLogo: {
    type: String,
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

businessSchema.index({ businessEmail: 1 });
businessSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model("Business", businessSchema);