const { Router } = require("express");
const { createPost } = require("../controllers/post.controller");

const router = Router();

router.post("/", createPost);

module.exports = { postRouter: router };
