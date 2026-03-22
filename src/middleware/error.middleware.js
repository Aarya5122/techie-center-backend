function errorMiddleware(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message =
    err.message || (status === 500 ? "Internal Server Error" : "Error");
  let details = err.details;

  if (err.name === "ValidationError") {
    status = 400;
    const entries = Object.values(err.errors);
    const missing = entries
      .filter((e) => e.kind === "required")
      .map((e) => e.path);
    const invalid = Object.fromEntries(
      entries
        .filter((e) => e.kind !== "required")
        .map((e) => [e.path, e.message])
    );
    const hasInvalid = Object.keys(invalid).length > 0;
    if (process.env.NODE_ENV !== "production") {
      console.error(err);
    }
    const payload = { error: {} };
    if (missing.length > 0) payload.error.missing = missing;
    if (hasInvalid) payload.error.invalid = invalid;
    if (missing.length === 0 && !hasInvalid) {
      payload.error.message = message;
      payload.error.details = entries.map((e) => e.message);
    }
    return res.status(status).json(payload);
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
