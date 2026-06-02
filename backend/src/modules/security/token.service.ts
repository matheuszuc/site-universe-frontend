import { createHash, randomBytes } from "node:crypto";

export class TokenService {
  generateOpaqueToken(bytes = 32) {
    return randomBytes(bytes).toString("base64url");
  }

  hashToken(token: string) {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }

  hashOptionalValue(value: string | undefined) {
    if (!value) {
      return null;
    }

    return this.hashToken(value);
  }
}

export const tokenService = new TokenService();
