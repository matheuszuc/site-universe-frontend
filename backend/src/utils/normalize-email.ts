import validator from "validator";

import { AppError } from "./safe-error.js";

export function normalizeEmail(email: string) {
  const trimmedEmail = email.trim();

  if (!validator.isEmail(trimmedEmail)) {
    throw new AppError(400, "BAD_REQUEST", "E-mail invalido.");
  }

  const normalizedEmail = validator.normalizeEmail(trimmedEmail, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false
  });

  return normalizedEmail || trimmedEmail.toLowerCase();
}
