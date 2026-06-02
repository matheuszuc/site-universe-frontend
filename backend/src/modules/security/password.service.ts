import argon2 from "argon2";

export class PasswordService {
  hashPassword(password: string) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });
  }

  verifyPassword(passwordHash: string, password: string) {
    return argon2.verify(passwordHash, password);
  }
}

export const passwordService = new PasswordService();
