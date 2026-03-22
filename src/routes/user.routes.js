const { Router } = require("express");
const { getAllUsers, createUser, updateUser } = require("../controllers/user.controller");

const router = Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.patch("/:userId", updateUser);

module.exports = { userRouter: router };
