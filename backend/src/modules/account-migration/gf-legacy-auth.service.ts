export type VerifiedLegacyGameAccount = {
  gameLogin: string;
  gameAccountId?: string | null;
};

export class GfLegacyAuthService {
  async verifyCredentials(_input: {
    gameLogin: string;
    currentPassword: string;
  }): Promise<VerifiedLegacyGameAccount | null> {
    // TODO: connect the real GF credential verifier after the legacy password format
    // and database access path are confirmed. This stub intentionally never accepts
    // credentials, so we do not invent a game password format or touch GF tables.
    return null;
  }

  async updatePasswordIfSupported(_input: {
    gameLogin: string;
    newPassword: string;
  }): Promise<"updated" | "not_supported"> {
    // TODO: implement only after the GF password format is verified.
    return "not_supported";
  }
}

export const gfLegacyAuthService = new GfLegacyAuthService();
