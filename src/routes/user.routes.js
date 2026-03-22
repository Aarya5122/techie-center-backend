const { Router } = require("express");
const { createUser } = require("../controllers/user.controller");

const router = Router();

router.post("/", createUser);

module.exports = { userRouter: router };
