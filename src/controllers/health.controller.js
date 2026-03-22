function getHealth(req, res) {
  res.status(200).json({ status: "Server is healthy and running" });
}

module.exports = { getHealth };
