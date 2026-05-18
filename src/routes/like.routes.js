const { Router } = require("express");
const { toggleLike } = require("../controllers/like.controller");

const router = Router({ mergeParams: true });

// POST /api/posts/:postId/likes  -> toggle like/unlike
router.post("/", toggleLike);

module.exports = { likeRouter: router };
