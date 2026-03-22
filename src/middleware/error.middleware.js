function errorMiddleware(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message =
    err.message || (status === 500 ? "Internal Server Error" : "Error");
  let details = err.details;

  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.code === 11000) {
    status = 409;
    message =
      err.keyPattern && err.keyPattern.email
        ? "Email already registered"
        : "A record with that unique field already exists";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json({
    error: { message, ...(details && { details }) },
  });
}

module.exports = { errorMiddleware };
