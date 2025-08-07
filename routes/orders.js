const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Orders endpoint working",
    orders: []
  });
});

router.post("/", (req, res) => {
  res.json({
    success: true,
    message: "Create order endpoint - coming soon"
  });
});

module.exports = router;
