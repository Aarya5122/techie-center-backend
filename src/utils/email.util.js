const validator = require("validator");

const EMAIL_OPTIONS = {
  allow_utf8_local_part: true,
};

function isValidEmail(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  return validator.isEmail(value.trim(), EMAIL_OPTIONS);
}

function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
}

module.exports = { isValidEmail, normalizeEmail };
