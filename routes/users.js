const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(auth);

const updateProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("about")
    .optional()
    .isLength({ max: 500 })
    .withMessage("About section cannot exceed 500 characters"),
];

router.get("/profile", userController.getProfile);
router.put("/profile", updateProfileValidation, userController.updateProfile);
router.put("/profile-image", upload.single("profileImage"), userController.updateProfileImage);
router.delete("/account", userController.deleteAccount);

router.put("/skip-corporate-info", userController.skipCorporateInfo);

router.get("/", authorize("admin"), userController.getAllUsers);
router.get("/:id", authorize("admin"), userController.getUserById);
router.put("/:id/status", authorize("admin"), userController.updateUserStatus);

module.exports = router;
