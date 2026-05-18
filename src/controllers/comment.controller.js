const { Post } = require("../models/post.model");

function isMissingString(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

async function addComment(req, res, next) {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;

    const missing = [];
    if (isMissingString(userId)) missing.push("userId");
    if (isMissingString(text)) missing.push("text");
    if (missing.length > 0) {
      return res.status(400).json({ error: { message: `Missing required fields: ${missing.join(", ")}` } });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    post.comments.push({ userId, text });
    await post.save();

    const comment = post.comments[post.comments.length - 1];
    const commentId = comment._id.toString();
    res.status(201).json({ comment: { ...comment.toJSON(), commentId } });
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (isMissingString(text)) {
      return res.status(400).json({ error: { message: "Missing required field: text" } });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: { message: "Comment not found" } });
    }

    comment.text = text;
    await post.save();

    res.status(200).json({ comment });
  } catch (err) {
    next(err);
  }
}

async function removeComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: { message: "Comment not found" } });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({ message: "Comment removed successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { addComment, updateComment, removeComment };
