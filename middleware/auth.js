const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
const auth = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No user found with this token",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
