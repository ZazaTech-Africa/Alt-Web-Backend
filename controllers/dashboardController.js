const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Business = require("../models/Business");
const moment = require("moment");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total dispatch counts
    const totalDispatchCount = await Order.countDocuments({ user: userId });

    // Get active dispatch counts (assigned, in_transit)
    const activeDispatchCount = await Order.countDocuments({
      user: userId,
      status: { $in: ["assigned", "in_transit"] }
    });

    // Get pending dispatch counts
    const pendingDispatchCount = await Order.countDocuments({
      user: userId,
      status: "pending"
    });

    // Get successful dispatch counts
    const successfulDispatchCount = await Order.countDocuments({
      user: userId,
      status: "delivered"
    });

    // Get cancelled dispatch counts
    const cancelledDispatchCount = await Order.countDocuments({
      user: userId,
      status: "cancelled"
    });

    // Calculate success rate
    const successRate = totalDispatchCount > 0 
      ? ((successfulDispatchCount / totalDispatchCount) * 100).toFixed(2)
      : 0;

    // Get total revenue (sum of actual costs for delivered orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          user: userId,
          status: "delivered",
          actualCost: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$actualCost" }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalDispatchCount,
        activeDispatchCount,
        pendingDispatchCount,
        successfulDispatchCount,
        cancelledDispatchCount,
        successRate: parseFloat(successRate),
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics",
    });
  }
};

// @desc    Get dispatch sales statistics
// @route   GET /api/dashboard/dispatch-sales
// @access  Private
exports.getDispatchSalesStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "7days" } = req.query;

    let startDate;
    let groupBy;

    // Determine date range and grouping based on period
    switch (period) {
      case "24hours":
        startDate = moment().subtract(24, "hours").toDate();
        groupBy = { $hour: "$createdAt" };
        break;
      case "7days":
        startDate = moment().subtract(7, "days").toDate();
        groupBy = { $dayOfWeek: "$createdAt" };
        break;
      case "30days":
        startDate = moment().subtract(30, "days").toDate();
        groupBy = { $dayOfMonth: "$createdAt" };
        break;
      case "12months":
        startDate = moment().subtract(12, "months").toDate();
        groupBy = { $month: "$createdAt" };
        break;
      default:
        startDate = moment().subtract(7, "days").toDate();
        groupBy = { $dayOfWeek: "$createdAt" };
    }

    // Get sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
          status: "delivered",
          actualCost: { $exists: true }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$actualCost" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get order trends
    const orderTrends = await Order.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            period: groupBy,
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.period",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      salesData,
      orderTrends,
      period,
    });
  } catch (error) {
    console.error("Get dispatch sales stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sales statistics",
    });
  }
};

// @desc    Get recent shipments
// @route   GET /api/dashboard/recent-shipments
// @access  Private
exports.getRecentShipments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const recentShipments = await Shipment.find({ user: userId })
      .populate("driver", "fullName profileImage rating")
      .populate("order", "orderNumber trackingNumber")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalShipments = await Shipment.countDocuments({ user: userId });

    const formattedShipments = recentShipments.map(shipment => ({
      id: shipment._id,
      dispatcherName: shipment.dispatcherName,
      driverName: shipment.driver?.fullName || "Unassigned",
      driverImage: shipment.driver?.profileImage,
      driverRating: shipment.driver?.rating || 0,
      itemsNo: shipment.itemsNo,
      orderDate: shipment.orderDate,
      dispatchDate: shipment.dispatchDate,
      dispatchLocation: shipment.dispatchLocation,
      quantity: shipment.quantity,
      dispatchStatus: shipment.dispatchStatus,
      orderNumber: shipment.order?.orderNumber,
      trackingNumber: shipment.order?.trackingNumber,
      customerRating: shipment.customerRating,
      estimatedDeliveryTime: shipment.estimatedDeliveryTime,
      actualDeliveryTime: shipment.actualDeliveryTime,
    }));

    res.status(200).json({
      success: true,
      shipments: formattedShipments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShipments / limit),
        totalShipments,
        hasNext: skip + recentShipments.length < totalShipments,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get recent shipments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recent shipments",
    });
  }
};

// @desc    Get dispatch history
// @route   GET /api/dashboard/history
// @access  Private
exports.getDispatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 20, 
      page = 1, 
      status, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = { user: userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
        { "pickupLocation.address": { $regex: search, $options: "i" } },
        { "deliveryLocation.address": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("assignedDriver", "fullName profileImage rating")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get dispatch history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dispatch history",
    });
  }
};

// @desc    Get dispatcher details
// @route   GET /api/dashboard/dispatcher-details
// @access  Private
exports.getDispatcherDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user and business details
    const user = await User.findById(userId);
    const business = await Business.findOne({ user: userId });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business information not found",
      });
    }

    // Get performance metrics
    const totalOrders = await Order.countDocuments({ user: userId });
    const completedOrders = await Order.countDocuments({ 
      user: userId, 
      status: "delivered" 
    });
    const cancelledOrders = await Order.countDocuments({ 
      user: userId, 
      status: "cancelled" 
    });

    // Calculate completion rate
    const completionRate = totalOrders > 0 
      ? ((completedOrders / totalOrders) * 100).toFixed(2)
      : 0;

    // Get average delivery time for completed orders
    const avgDeliveryTime = await Order.aggregate([
      {
        $match: {
          user: userId,
          status: "delivered",
          actualDeliveryDate: { $exists: true },
          createdAt: { $exists: true }
        }
      },
      {
        $project: {
          deliveryTime: {
            $divide: [
              { $subtract: ["$actualDeliveryDate", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: "$deliveryTime" }
        }
      }
    ]);

    const averageDeliveryDays = avgDeliveryTime.length > 0 
      ? avgDeliveryTime[0].avgDays.toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      dispatcher: {
        personalInfo: {
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
          about: user.about,
          memberSince: user.createdAt,
          lastLogin: user.lastLogin,
        },
        businessInfo: {
          businessName: business.businessName,
          businessEmail: business.businessEmail,
          businessAddress: business.businessAddress,
          businessHotline: business.businessHotline,
          alternativePhoneNumber: business.alternativePhoneNumber,
          cacRegistrationNumber: business.cacRegistrationNumber,
          isVerified: business.isVerified,
          verificationStatus: business.verificationStatus,
        },
        performanceMetrics: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          completionRate: parseFloat(completionRate),
          averageDeliveryDays: parseFloat(averageDeliveryDays),
          businessRating: business.rating,
        },
      },
    });
  } catch (error) {
    console.error("Get dispatcher details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dispatcher details",
    });
  }
};
