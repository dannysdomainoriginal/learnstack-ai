import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  // 1. Read the token from the cookies instead of the Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check if the token actually exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "You are not logged in.",
      status: 401,
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Assigned token's user does not exist",
        status: 401,
      });
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "JWT token has expired",
        status: 401,
      });
    }

    return res.status(401).json({
      success: false,
      error: "Authentication failed. Please re-login",
      status: 401,
    });
  }
};

export default protect;
