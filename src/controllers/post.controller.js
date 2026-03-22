const { Post } = require("../models/post.model");

function isMissingString(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

async function createPost(req, res, next) {
  try {
    const { content, category, userId } = req.body;

    const missing = [];
    if (isMissingString(content)) missing.push("content");
    if (isMissingString(category)) missing.push("category");
    if (isMissingString(userId)) missing.push("userId");
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: { message: `Missing required fields: ${missing.join(", ")}` } });
    }

    const post = await Post.create({ content, category, userId });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost };
