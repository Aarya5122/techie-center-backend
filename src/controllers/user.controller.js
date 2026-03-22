const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("../models/user.model");

const UPDATABLE_FIELDS = [
  "email",
  "password",
  "name",
  "gender",
  "phoneNumber",
  "age",
  "currentOccupation",
  "currentWorkingOrganization",
];

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
      // userId,
      user: { ...user.toJSON(), userId },
    });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: { message: "Invalid user id" },
      });
    }

    const updates = {};
    for (const key of UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: "No updatable fields in payload" },
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "password")) {
      if (isMissingString(updates.password)) {
        return res.status(400).json({
          error: { missing: ["password"] },
        });
      }
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      if (isMissingString(updates.name)) {
        return res.status(400).json({
          error: { missing: ["name"] },
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "email")) {
      if (isMissingString(updates.email)) {
        return res.status(400).json({
          error: { missing: ["email"] },
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const id = user._id.toString();
    res.json({
      user: { ...user.toJSON(), userId: id },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, updateUser };
