function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    err.message || (status === 500 ? "Internal Server Error" : "Error");

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json({
    error: { message, ...(err.expose && { details: err.details }) },
  });
}

module.exports = { errorMiddleware };
