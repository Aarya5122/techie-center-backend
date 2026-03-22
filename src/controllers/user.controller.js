const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("../models/user.model");
const { isValidEmail, normalizeEmail } = require("../utils/email.util");
const { parseFilterFromQueryParam } = require("../utils/queryFilter.util");

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

const MAX_PAGE_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 100;

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return n;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Query: filter = stringified JSON { field, op, value } — raw or URL-encoded.
 */
function parseListFilterParam(query) {
  const { parsed, error: parseError } = parseFilterFromQueryParam(
    query.filter
  );
  if (parseError) {
    return { spec: null, error: parseError };
  }
  if (!parsed) {
    return { spec: null, error: null };
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {
      spec: null,
      error: "filter must be a JSON object with field, op, and value.",
    };
  }

  const { field, op, value } = parsed;
  if (field === undefined || op === undefined || value === undefined) {
    return {
      spec: null,
      error: "filter requires field, op, and value.",
    };
  }
  if (typeof field !== "string" || typeof op !== "string") {
    return {
      spec: null,
      error: "filter field and op must be strings.",
    };
  }

  const valueStr =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : String(value);

  if (valueStr.trim() === "") {
    return { spec: null, error: "filter value cannot be empty." };
  }

  return {
    spec: {
      field: field.trim().toLowerCase(),
      op: op.trim().toLowerCase(),
      value: valueStr.trim(),
    },
    error: null,
  };
}

function mongoFilterFromListSpec(spec) {
  const { field, op, value } = spec;

  if (field !== "email") {
    return {
      filter: {},
      error: `Unsupported filter field: ${field}. Supported: email.`,
    };
  }

  const normalizedOp =
    op === "equals" ? "eq" : op === "like" ? "contains" : op;

  if (!["eq", "contains", "auto"].includes(normalizedOp)) {
    return {
      filter: {},
      error: "filter op must be 'eq', 'contains', or 'auto'.",
    };
  }

  if (normalizedOp === "eq") {
    return { filter: { email: normalizeEmail(value) }, error: null };
  }
  if (normalizedOp === "contains") {
    return {
      filter: {
        email: {
          $regex: escapeRegex(value),
          $options: "i",
        },
      },
      error: null,
    };
  }

  if (isValidEmail(value)) {
    return { filter: { email: normalizeEmail(value) }, error: null };
  }
  return {
    filter: {
      email: {
        $regex: escapeRegex(value),
        $options: "i",
      },
    },
    error: null,
  };
}

function buildUserListFilter(query) {
  const { spec, error } = parseListFilterParam(query);
  if (error) {
    return { filter: {}, error };
  }
  if (!spec) {
    return { filter: {}, error: null };
  }
  return mongoFilterFromListSpec(spec);
}

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

async function getAllUsers(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const requestedSize = parsePositiveInt(
      req.query.pageSize,
      DEFAULT_PAGE_SIZE
    );

    if (page === null || requestedSize === null) {
      return res.status(400).json({
        error: {
          message:
            "page and pageSize must be positive integers (pageSize max 100)",
        },
      });
    }

    const pageSize = Math.min(requestedSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const { filter, error: filterError } = buildUserListFilter(req.query);
    if (filterError) {
      return res.status(400).json({ error: { message: filterError } });
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
    ]);

    const list = users.map((user) => {
      const userId = user._id.toString();
      return { ...user.toJSON(), userId };
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    res.json({
      users: list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const user = await User.findById(userId);
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

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: { message: "Please provide a valid email address" },
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
      Object.prototype.hasOwnProperty.call(updates, "email") &&
      !isValidEmail(updates.email)
    ) {
      return res.status(400).json({
        error: { message: "Please provide a valid email address" },
      });
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

module.exports = { getAllUsers, getUserById, createUser, updateUser };
