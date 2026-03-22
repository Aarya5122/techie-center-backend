function notFoundMiddleware(req, res) {
  res.status(404).json({ error: { message: "Requested page or resource not found" } });
}

module.exports = { notFoundMiddleware };
