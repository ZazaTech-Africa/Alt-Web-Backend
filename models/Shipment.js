const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  
  // Shipment details
  dispatcherName: {
    type: String,
    required: [true, "Dispatcher name is required"],
  },
  itemsNo: {
    type: Number,
    required: [true, "Items number is required"],
  },
  orderDate: {
    type: Date,
    required: [true, "Order date is required"],
  },
  dispatchDate: {
    type: Date,
    required: [true, "Dispatch date is required"],
  },
  dispatchLocation: {
    type: String,
    required: [true, "Dispatch location is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  dispatchStatus: {
    type: String,
    enum: ["pending", "dispatched", "in_transit", "delivered", "cancelled"],
    default: "pending",
  },
  
  // Delivery information
  deliveryLocation: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  // Review and rating
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  customerReview: {
    type: String,
    maxlength: [500, "Review cannot exceed 500 characters"],
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  
  // Tracking updates
  trackingUpdates: [{
    status: String,
    location: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  }],
  
}, {
  timestamps: true,
});

// Indexes
shipmentSchema.index({ order: 1 });
shipmentSchema.index({ user: 1 });
shipmentSchema.index({ driver: 1 });
shipmentSchema.index({ dispatchStatus: 1 });
shipmentSchema.index({ orderDate: -1 });

module.exports = mongoose.model("Shipment", shipmentSchema);
