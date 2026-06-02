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

  markLoginFailed(id: string) {
    return usersRepository.incrementFailedLogin(id);
  }
}

export const usersService = new UsersService();
