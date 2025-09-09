const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Business = require("../models/Business");
const moment = require("moment");

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalDispatchCount = await Order.countDocuments({ user: userId });

    const activeDispatchCount = await Order.countDocuments({
      user: userId,
      status: { $in: ["assigned", "in_transit"] }
    });

    const pendingDispatchCount = await Order.countDocuments({
      user: userId,
      status: "pending"
    });

    const successfulDispatchCount = await Order.countDocuments({
      user: userId,
      status: "delivered"
    });

    const cancelledDispatchCount = await Order.countDocuments({
      user: userId,
      status: "cancelled"
    });

    // Calculate percentage changes (for frontend display)
    const totalPercentChange = 50; // Example value, replace with actual calculation
    const activePercentChange = 100; // Example value, replace with actual calculation
    const pendingPercentChange = 90; // Example value, replace with actual calculation
    const successfulPercentChange = 150; // Example value, replace with actual calculation

    const successRate = totalDispatchCount > 0 
      ? ((successfulDispatchCount / totalDispatchCount) * 100).toFixed(2)
      : 0;

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
        totalDispatch: {
          count: totalDispatchCount,
          percentChange: totalPercentChange
        },
        activeDispatch: {
          count: activeDispatchCount,
          percentChange: activePercentChange
        },
        pendingDispatch: {
          count: pendingDispatchCount,
          percentChange: pendingPercentChange
        },
        successfulDispatch: {
          count: successfulDispatchCount,
          percentChange: successfulPercentChange
        },
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

exports.getDispatchSalesStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "7days" } = req.query;

    let startDate;
    let groupBy;

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

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
  
  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

// Helper function to format price
function formatPrice(price) {
  return `N${price.toLocaleString()}`;
}

exports.getRecentShipments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    // Get actual shipments from database
    const recentShipments = await Shipment.find({ user: userId })
      .populate("driver", "fullName profileImage rating")
      .populate("order", "orderNumber trackingNumber description pickupLocation deliveryLocation estimatedCost")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalShipments = await Shipment.countDocuments({ user: userId });

    // Format shipments to match frontend requirements
    const formattedShipments = recentShipments.map(shipment => ({
      id: shipment._id,
      status: shipment.dispatchStatus === "delivered" ? "Picked" : "Not Picked",
      productName: shipment.order?.description?.substring(0, 20) || "Product",
      min: getTimeAgo(shipment.createdAt),
      pickUp: shipment.order?.pickupLocation?.address || "N/A",
      dropOff: shipment.order?.deliveryLocation?.address || "N/A",
      customerName: shipment.dispatcherName || "Customer",
      deliveryPrice: formatPrice(shipment.order?.estimatedCost || 0),
      profileName: shipment.driver?.fullName || "Unassigned",
      // Keep original fields for backward compatibility
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

    // Add mock data if no shipments found
    if (formattedShipments.length === 0) {
      const mockDeliveries = [
        { 
          status: "Not Picked", 
          productName: "LG TV", 
          min: "5 mins ago", 
          pickUp: "N0 7 Agip Road, Port Harcourt.", 
          dropOff: "N0 20 Agip Road, Port Harcourt.", 
          customerName: "Victor John", 
          deliveryPrice: "N5,500", 
          profileName: "Dan Jane" 
        },
        { 
          status: "Picked", 
          productName: "Tin Tomato", 
          min: "10 mins ago", 
          pickUp: "N0 7 Agip Road, Port Harcourt.", 
          dropOff: "N0 20 Agip Road, Port Harcourt.", 
          customerName: "Samuel John", 
          deliveryPrice: "N10,000", 
          profileName: "john Doe" 
        },
        { 
          status: "Picked", 
          productName: "Refrigerator", 
          min: "2 mins ago", 
          pickUp: "N0 7 Agip Road, Port Harcourt.", 
          dropOff: "N0 20 Agip Road, Port Harcourt.", 
          customerName: "Victor John", 
          deliveryPrice: "N70,500", 
          profileName: "Dan Jane" 
        }
      ];
      
      return res.status(200).json({
        success: true,
        shipments: mockDeliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalShipments: mockDeliveries.length,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

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

    // Format orders to match frontend requirements
    const formattedOrders = orders.map(order => ({
      id: order._id,
      status: order.status === "delivered" ? "Picked" : "Not Picked",
      productName: order.description?.substring(0, 20) || "Product",
      min: getTimeAgo(order.createdAt),
      pickUp: order.pickupLocation?.address || "N/A",
      dropOff: order.deliveryLocation?.address || "N/A",
      customerName: order.pickupLocation?.contactPerson || "Customer",
      deliveryPrice: formatPrice(order.estimatedCost || 0),
      profileName: order.assignedDriver?.fullName || "Unassigned",
      // Keep original fields for backward compatibility
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      itemsCount: order.itemsCount,
      quantity: order.quantity,
      vehicleType: order.vehicleType,
      estimatedCost: order.estimatedCost,
      actualCost: order.actualCost,
      orderDate: order.orderDate,
      requestedDeliveryDate: order.requestedDeliveryDate,
      actualDispatchDate: order.actualDispatchDate,
      actualDeliveryDate: order.actualDeliveryDate,
    }));

    // Add monthly history data for the chart
    const monthlyData = [
      { month: "January", percentage: 100 },
      { month: "Febuary", percentage: 80 },
      { month: "March", percentage: 95 },
      { month: "April", percentage: 50 }
    ];

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      history: monthlyData,
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

exports.getDispatcherDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mock data for dispatcher details to match frontend requirements
    const dispatchers = [
      {
        id: 1,
        name: "Peter Akpon",
        image: "https://randomuser.me/api/portraits/men/1.jpg"
      },
      {
        id: 2,
        name: "John West",
        image: "https://randomuser.me/api/portraits/men/2.jpg"
      },
      {
        id: 3,
        name: "Mr Casper Ude",
        image: "https://randomuser.me/api/portraits/men/3.jpg"
      },
      {
        id: 4,
        name: "Frank Lampard",
        image: "https://randomuser.me/api/portraits/men/4.jpg"
      },
      {
        id: 5,
        name: "Harrison Adokie",
        image: "https://randomuser.me/api/portraits/men/5.jpg"
      }
    ];

    // Get actual dispatchers from database
    const user = await User.findById(userId);
    const business = await Business.findOne({ user: userId });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business information not found",
      });
    }

    const totalOrders = await Order.countDocuments({ user: userId });
    const completedOrders = await Order.countDocuments({ 
      user: userId, 
      status: "delivered" 
    });
    const cancelledOrders = await Order.countDocuments({ 
      user: userId, 
      status: "cancelled" 
    });

    const completionRate = totalOrders > 0 
      ? ((completedOrders / totalOrders) * 100).toFixed(2)
      : 0;

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
              1000 * 60 * 60 * 24 
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
      dispatchers: dispatchers, // Add mock dispatchers to match frontend
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
