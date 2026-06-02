export type SafeErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "FORBIDDEN_ORIGIN"
  | "CSRF_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INVALID_OR_EXPIRED_TOKEN"
  | "INTERNAL_SERVER_ERROR";

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
