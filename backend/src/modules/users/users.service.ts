import { normalizeEmail } from "../../utils/normalize-email.js";
import { usersRepository } from "./users.repository.js";

export class UsersService {
  findById(id: string) {
    return usersRepository.findById(id);
  }

  findByEmail(email: string) {
    return usersRepository.findByNormalizedEmail(normalizeEmail(email));
  }

  markLoginSuccess(id: string) {
    return usersRepository.updateLoginSuccess(id);
  }

  markLoginFailed(id: string, failedLoginCount: number, lockedUntil: Date | null) {
    return usersRepository.recordLoginFailure(id, failedLoginCount, lockedUntil);
  }

  incrementLoginFailureAtomic(id: string, maxFailures: number, lockMinutes: number) {
    return usersRepository.incrementLoginFailureAtomic(id, maxFailures, lockMinutes);
  }

  markEmailVerified(id: string, verifiedAt: Date) {
    return usersRepository.markEmailVerified(id, verifiedAt);
  }

  updatePasswordAfterReset(id: string, passwordHash: string) {
    return usersRepository.updatePasswordAfterReset(id, passwordHash);
  }
}

export const usersService = new UsersService();
