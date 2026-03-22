const { Router } = require("express");
const { healthRouter } = require("./health.routes");
const { userRouter } = require("./user.routes");

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", userRouter);

module.exports = { apiRouter };
