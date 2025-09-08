const express = require("express");
const { body } = require("express-validator");
const businessController = require("../controllers/businessController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(auth);

const businessKYCValidation = [
  body("businessName")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Business name must be between 2 and 200 characters"),
  body("businessEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid business email address"),
  body("streetAddress")
    .notEmpty()
    .withMessage("Street address is required"),
  body("city")
    .notEmpty()
    .withMessage("City is required"),
  body("state")
    .notEmpty()
    .withMessage("State is required"),
  body("country")
    .optional()
    .notEmpty()
    .withMessage("Country is required"),
  body("zipCode")
    .optional()
    .withMessage("Zip code is optional"),
  body("cacRegistrationNumber")
    .notEmpty()
    .withMessage("CAC registration number is required"),
  body("businessHotline")
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please enter a valid business hotline"),
  body("alternativePhoneNumber")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please enter a valid alternative phone number"),
  body("wantSharperlyDriverOrders")
    .isBoolean()
    .withMessage("Please specify if you want Sharperly driver orders"),
];


const vehicleRegistrationValidation = [
  body("numberOfDrivers")
    .isInt({ min: 0 })
    .withMessage("Number of drivers must be a non-negative integer"),
  body("numberOfCars")
    .isInt({ min: 0 })
    .withMessage("Number of cars must be a non-negative integer"),
  body("numberOfBikes")
    .isInt({ min: 0 })
    .withMessage("Number of bikes must be a non-negative integer"),
  body("numberOfVans")
    .isInt({ min: 0 })
    .withMessage("Number of vans must be a non-negative integer"),
];

// Base64 route - for JSON data with base64-encoded images
router.post("/kyc/base64", businessKYCValidation, businessController.submitKYC);

// Legacy route - for multipart form data (backward compatibility)
router.post("/kyc", upload.any(), businessKYCValidation, businessController.submitKYC);
router.get("/kyc", businessController.getKYC);
router.put("/kyc", upload.fields([{ name: 'proofOfAddress', maxCount: 1 }, { name: 'businessLogo', maxCount: 1 }]), businessController.updateKYC);

router.post("/vehicles", vehicleRegistrationValidation, businessController.registerVehicles);
router.get("/vehicles", businessController.getVehicles);
router.put("/vehicles", vehicleRegistrationValidation, businessController.updateVehicles);

router.put("/complete-onboarding", businessController.completeOnboarding);

module.exports = router;
