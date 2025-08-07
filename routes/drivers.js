const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Drivers endpoint working",
    drivers: []
  });
});

module.exports = router;
