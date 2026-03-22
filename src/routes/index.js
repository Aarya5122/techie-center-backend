const { Router } = require("express");
const { healthRouter } = require("./health.routes");
const { userRouter } = require("./user.routes");
const { postRouter } = require("./post.routes");

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/posts", postRouter);

module.exports = { apiRouter };
