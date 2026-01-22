import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Auth header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

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
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "You are not logged in.",
      status: 401,
    });
  }
};

export default protect;
