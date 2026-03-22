const { Router } = require("express");
const {
  getAllUsers,
  getUserById,
  deleteUser,
  createUser,
  updateUser,
} = require("../controllers/user.controller");

const router = Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:userId", getUserById);
router.patch("/:userId", updateUser);
router.delete("/:userId", deleteUser);

module.exports = { userRouter: router };
