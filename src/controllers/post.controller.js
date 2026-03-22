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
    const { content, category, userId, likes, comments } = req.body;

    const missing = [];
    if (isMissingString(content)) missing.push("content");
    if (isMissingString(category)) missing.push("category");
    if (isMissingString(userId)) missing.push("userId");
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: { message: `Missing required fields: ${missing.join(", ")}` } });
    }

    if (likes !== undefined && !Array.isArray(likes)) {
      return res.status(400).json({ error: { message: "likes must be an array of user IDs" } });
    }

    if (comments !== undefined && !Array.isArray(comments)) {
      return res.status(400).json({ error: { message: "comments must be an array of comment objects" } });
    }

    const post = await Post.create({
      content,
      category,
      userId,
      ...(likes && { likes }),
      ...(comments && { comments }),
    });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost };
