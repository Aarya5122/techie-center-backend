const { Post } = require("../models/post.model");

async function toggleLike(req, res, next) {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: { message: "Missing required field: userId" } });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      // Remove like
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Add like
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      liked: !alreadyLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleLike };
