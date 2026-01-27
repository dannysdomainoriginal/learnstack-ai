import { Router } from "express";
import { body, validationResult } from "express-validator";
import * as authController from "../controllers/authController.js";
import protect from "../middleware/auth.js";

const router = Router();

// Validation middleware
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email field is required")
    .bail()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email field is required")
    .bail()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Public routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);

// Protected routes
router.get("/profile", protect, authController.getProfile);
router.put("/profile", protect, authController.updateProfile);
router.post("/change-password", protect, authController.changePassword);

export default router;

// Send errors on validation
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      status: 400,
    });
  }

  next();
}
