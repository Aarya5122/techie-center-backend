const bcrypt = require("bcrypt");
const { User } = require("../models/user.model");

const SALT_ROUNDS = 10;

async function createUser(req, res, next) {
  try {
    const {
      email,
      password,
      name,
      gender,
      phoneNumber,
      age,
      currentOccupation,
      currentWorkingOrganization,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: "email, password, and name are required" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      gender,
      phoneNumber,
      age,
      currentOccupation,
      currentWorkingOrganization,
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser };
