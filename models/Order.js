const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
  
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  itemsCount: {
    type: Number,
    required: [true, "Items count is required"],
    min: [1, "Items count must be at least 1"],
  },
  description: {
    type: String,
    required: [true, "Order description is required"],
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  
  pickupLocation: {
    address: {
      type: String,
      required: [true, "Pickup address is required"],
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    contactPerson: String,
    contactPhone: String,
  },
  deliveryLocation: {
    address: {
      type: String,
      required: [true, "Delivery address is required"],
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    contactPerson: String,
    contactPhone: String,
  },
  
  orderDate: {
    type: Date,
    default: Date.now,
  },
  requestedDeliveryDate: {
    type: Date,
    required: [true, "Requested delivery date is required"],
  },
  actualDispatchDate: Date,
  actualDeliveryDate: Date,
  
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  vehicleType: {
    type: String,
    enum: ["car", "bike", "van"],
    required: [true, "Vehicle type is required"],
  },
  
  status: {
    type: String,
    enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
    default: "pending",
  },
  
  estimatedCost: {
    type: Number,
    required: [true, "Estimated cost is required"],
    min: [0, "Cost cannot be negative"],
  },
  actualCost: Number,
  
  trackingNumber: {
    type: String,
    unique: true,
  },
  
  notes: String,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  }],
  
}, {
  timestamps: true,
});

orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `SHP${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
  }
  
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  
  next();
});

orderSchema.pre("save", function(next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

orderSchema.index({ user: 1 });
orderSchema.index({ business: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ trackingNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ assignedDriver: 1 });

module.exports = mongoose.model("Order", orderSchema);
