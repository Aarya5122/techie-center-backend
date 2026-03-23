const { Router } = require("express");
const { toggleLike } = require("../controllers/like.controller");

const router = Router({ mergeParams: true });

// POST /api/posts/:postId/likes  →  add like
// DELETE /api/posts/:postId/likes  →  remove like
router.post("/", toggleLike);
router.delete("/", toggleLike);

module.exports = { likeRouter: router };
