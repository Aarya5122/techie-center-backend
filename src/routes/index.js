const { Router } = require("express");
const { healthRouter } = require("./health.routes");
const { userRouter } = require("./user.routes");
const { postRouter } = require("./post.routes");
const { likeRouter } = require("./like.routes");
const { commentRouter } = require("./comment.routes");

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/posts", postRouter);
apiRouter.use("/posts/:postId/likes", likeRouter);
apiRouter.use("/posts/:postId/comments", commentRouter);

module.exports = { apiRouter };
