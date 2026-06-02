import { tokenService } from "./token.service.js";

export class CsrfService {
  generateToken() {
    return tokenService.generateSecureToken();
  }

  hashToken(token: string) {
    return tokenService.hashToken(token);
  }

  verifyToken(token: string | undefined, expectedHash: string | null) {
    if (!token || !expectedHash) {
      return false;
    }

    return this.hashToken(token) === expectedHash;
  }
}

export const csrfService = new CsrfService();
