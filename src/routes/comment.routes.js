const { Router } = require("express");
const { addComment, updateComment, removeComment } = require("../controllers/comment.controller");

const router = Router({ mergeParams: true });

router.post("/", addComment);
router.patch("/:commentId", updateComment);
router.delete("/:commentId", removeComment);

module.exports = { commentRouter: router };
