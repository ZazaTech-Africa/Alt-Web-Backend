const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// Dashboard routes
router.get("/stats", dashboardController.getDashboardStats);
router.get("/dispatch-sales", dashboardController.getDispatchSalesStats);
router.get("/recent-shipments", dashboardController.getRecentShipments);
router.get("/history", dashboardController.getDispatchHistory);
router.get("/dispatcher-details", dashboardController.getDispatcherDetails);

module.exports = router;
