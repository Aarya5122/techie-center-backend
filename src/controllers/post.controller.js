const { Post } = require("../models/post.model");
const { cloudinary } = require("../config/cloudinary");

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "techie-center/posts" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

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

    let photoUrl = null;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        photoUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.log("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ error: { message: "Photo upload failed. Please try again." } });
      }
    }

    const post = await Post.create({
      content,
      category,
      userId,
      photoUrl,
      ...(likes && { likes }),
      ...(comments && { comments }),
    });

    const postId = post._id.toString();
    res.status(201).json({ post: { ...post.toJSON(), postId } });
  } catch (err) {
    next(err);
  }
}

async function getAllPosts(_req, res, next) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const data = posts.map((post) => {
      const postJson = post.toJSON();
      return { ...postJson, postId: post._id.toString() };
    });

    res.status(200).json({ posts: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, getAllPosts };
