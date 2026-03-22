const express = require("express");
const { apiRouter } = require("./routes");
const { notFoundMiddleware } = require("./middleware/notFound.middleware");
const { errorMiddleware } = require("./middleware/error.middleware");

const app = express();

app.use(express.json());
app.    use("/api", apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = { app };
