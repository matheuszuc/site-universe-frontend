export type SafeErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
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
