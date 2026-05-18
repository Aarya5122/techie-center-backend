const { Router } = require("express");
const multer = require("multer");
const { createPost, deletePost, updatePost } = require("../controllers/post.controller");
const { upload } = require("../middleware/upload.middleware");

const router = Router();

function handleUpload(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: { message: "File too large. Maximum size is 5 MB" } });
    }
    if (err) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next();
  });
}

router.post("/", handleUpload, createPost);
router.patch("/:postId", handleUpload, updatePost);
router.delete("/:postId", deletePost);

module.exports = { postRouter: router };
