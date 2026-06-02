const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = "Invalid id passed in request params";
    status = 404;
  }

  // Mongoose duplicate key
  if (err.name === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    status = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    status = 400;
  }

  // Multer file size error
  if (err.name === "LIMIT_FILE_SIZE") {
    message = "File size exceeds the maximum limit of 10MB";
    status = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    status = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    status = 401;
  }

  console.log("wow");
  if (status === 500) {
    console.error("Error:", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  res.status(status).json({
    success: false,
    error: message,
    status,
  });
};

export default errorHandler;
