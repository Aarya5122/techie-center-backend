const { Router } = require("express");
const { createUser, updateUser } = require("../controllers/user.controller");

const router = Router();

router.post("/", createUser);
router.patch("/:userId", updateUser);

module.exports = { userRouter: router };
