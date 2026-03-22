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

async function addLike(req, res, next) {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (isMissingString(userId)) {
      return res.status(400).json({ error: { message: "Missing required field: userId" } });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);
    if (alreadyLiked) {
      return res.status(400).json({ error: { message: "User has already liked this post" } });
    }

    post.likes.push(userId);
    await post.save();

    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;

    const missing = [];
    if (isMissingString(userId)) missing.push("userId");
    if (isMissingString(text)) missing.push("text");
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: { message: `Missing required fields: ${missing.join(", ")}` } });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    post.comments.push({ userId, text });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ comment: newComment });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, addLike, addComment };
