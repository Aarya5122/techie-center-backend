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

function getCloudinaryPublicId(photoUrl) {
  const afterUpload = photoUrl.split("/upload/")[1];
  return afterUpload.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
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

async function getAllPosts(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const { userId } = req.query;
    const filter = {};
    if (!isMissingString(userId)) {
      filter.userId = userId.trim();
    }

    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    const data = posts.map((post) => {
      const postJson = post.toJSON();
      return { ...postJson, postId: post._id.toString() };
    });

    res.status(200).json({
      posts: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      filters: {
        userId: filter.userId || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    res.status(200).json({ post: { ...post.toJSON(), postId: post._id.toString() } });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    if (post.photoUrl) {
      try {
        // Cloudinary delete expects publicId in <folder>/<filename> format (no extension/version).
        const publicId = getCloudinaryPublicId(post.photoUrl);
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryErr) {
        console.error("Cloudinary delete error:", cloudinaryErr);
        return res.status(502).json({ error: { message: "Failed to delete photo. Post not deleted." } });
      }
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;
    const { content, category } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: { message: "Post not found" } });
    }

    const isContentProvided = content !== undefined;
    const isCategoryProvided = category !== undefined;
    const isPhotoProvided = Boolean(req.file);

    if (!isContentProvided && !isCategoryProvided && !isPhotoProvided) {
      return res.status(400).json({
        error: { message: "Provide at least one field to update: content, category, or photo" },
      });
    }

    if (isContentProvided) {
      if (isMissingString(content)) {
        return res.status(400).json({ error: { message: "content cannot be empty" } });
      }
      post.content = content;
    }

    if (isCategoryProvided) {
      if (isMissingString(category)) {
        return res.status(400).json({ error: { message: "category cannot be empty" } });
      }
      post.category = category;
    }

    if (isPhotoProvided) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        const oldPhotoUrl = post.photoUrl;
        post.photoUrl = uploadResult.secure_url;

        if (oldPhotoUrl) {
          try {
            const oldPublicId = getCloudinaryPublicId(oldPhotoUrl);
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (cloudinaryErr) {
            console.error("Cloudinary old photo delete error:", cloudinaryErr);
          }
        }
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ error: { message: "Photo upload failed. Please try again." } });
      }
    }

    await post.save();

    const updatedPostId = post._id.toString();
    res.status(200).json({ post: { ...post.toJSON(), postId: updatedPostId } });
  } catch (err) {
    next(err);
  }
}
module.exports = { createPost, getAllPosts, getPostById, deletePost, updatePost };


