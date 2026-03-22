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

function createMissingRequiredFieldsPayload(missing) {
  return {
    error: {
      message: `Missing required fields : ${missing.join(",")}`,
    },
  };
}

function updateEmptyRequiredFieldsPayload(missing) {
  return {
    error: {
      message: `Following fields are required and cannot be set to empty : ${missing.join(",")}`,
    },
  };
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
      return res.status(400).json(createMissingRequiredFieldsPayload(missing));
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
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    const updates = {};
    for (const key of UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      const existing = await User.findById(userId);
      if (!existing) {
        return res.status(404).json({ error: { message: "User not found" } });
      }
      const id = existing._id.toString();
      return res.status(200).json({
        user: { ...existing.toJSON(), userId: id },
      });
    }

    const missing = [];
    if (
      Object.prototype.hasOwnProperty.call(updates, "password") &&
      isMissingString(updates.password)
    ) {
      // missing.push("password");
      delete updates.password;
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "name") &&
      isMissingString(updates.name)
    ) {
      // missing.push("name");
      delete updates.name;
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "email") &&
      isMissingString(updates.email)
    ) {
      // missing.push("email");
      delete updates.email;
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "password") &&
      !Object.prototype.hasOwnProperty.call(body, "oldPassword") ||
      isMissingString(body.oldPassword)
    ) {
      // missing.push("oldPassword");
      return res.status(400).json({ error: { message: "Old password is required to update new password" } });
    }

    if (missing.length > 0) {
      return res.status(400).json(updateEmptyRequiredFieldsPayload(missing));
    }

    if (Object.prototype.hasOwnProperty.call(updates, "password")) {
      const userWithPassword = await User.findById(userId).select("+password");
      if (!userWithPassword) {
        return res.status(404).json({ error: { message: "User not found" } });
      }
      const oldPasswordValid = await bcrypt.compare(
        body.oldPassword,
        userWithPassword.password
      );
      if (!oldPasswordValid) {
        return res.status(401).json({
          error: { message: "Old password entered is invalid" },
        });
      }
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
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
