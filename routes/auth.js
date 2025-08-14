const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();
const registerValidation = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
];

const verifyResetCodeValidation = [
  body("verificationCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Please enter a valid 6-digit code"),
];

const resetPasswordValidation = [
  body("verificationCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Please enter a valid 6-digit code"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

const verifyEmailValidation = [
  body("verificationCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Please enter a valid 6-digit code"),
];

router.post("/register", registerValidation, authController.register);
router.post("/verify-email", verifyEmailValidation, authController.verifyEmail);
router.post("/resend-verification", auth, authController.resendVerification);

router.post("/login", loginValidation, authController.login);
router.post("/logout", authController.logout);

router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword);
router.post("/verify-reset-code", verifyResetCodeValidation, authController.verifyResetCode);
router.post("/reset-password", resetPasswordValidation, authController.resetPassword);

router.get("/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

router.get("/me", auth, authController.getMe);
router.put("/update-password", auth, authController.updatePassword);

module.exports = router;
