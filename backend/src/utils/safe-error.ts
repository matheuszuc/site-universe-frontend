export type SafeErrorCode =
  | "ACCOUNT_ALREADY_MIGRATED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "FORBIDDEN"
  | "FORBIDDEN_ORIGIN"
  | "CSRF_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INVALID_OR_EXPIRED_TOKEN"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR"
  | "MIGRATION_DISABLED"
  | "RECAPTCHA_REQUIRED"
  | "RECAPTCHA_FAILED"
  | "RECAPTCHA_SERVICE_UNAVAILABLE";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: SafeErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function safeError(code: SafeErrorCode, message: string) {
  return {
    error: {
      code,
      message
    }
  };
}
