const { Router } = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
} = require("../controllers/user.controller");

const router = Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:userId", getUserById);
router.patch("/:userId", updateUser);

module.exports = { userRouter: router };
