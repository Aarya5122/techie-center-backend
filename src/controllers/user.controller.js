const bcrypt = require("bcrypt");
const { User } = require("../models/user.model");

const SALT_ROUNDS = 10;

function isMissingString(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

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

    const missing = [];
    if (isMissingString(email)) missing.push("email");
    if (isMissingString(password)) missing.push("password");
    if (isMissingString(name)) missing.push("name");
    if (missing.length > 0) {
      return res.status(400).json({ error: { message: `Missing required fields : ${missing?.join(",")}` } });
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

    const userId = user._id.toString();
    res.status(201).json({
      userId,
      user: { ...user.toJSON(), userId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser };
