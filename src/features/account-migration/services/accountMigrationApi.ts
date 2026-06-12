import { apiRequest } from '../../../services/api'

export type AccountMigrationStatus =
  | {
      status: 'none'
    }
  | {
      status: 'verified'
      gameLogin: string
      expiresAt: string
    }

export type StartAccountMigrationInput = {
  gameLogin: string
  currentPassword: string
  recaptchaToken?: string
}

export type CompleteAccountMigrationInput = {
  email: string
  newPassword: string
  confirmPassword: string
}

export type StartAccountMigrationResponse = {
  success: true
  gameLogin: string
  expiresAt: string
}

export type CompleteAccountMigrationResponse = {
  success: true
  status: 'email_verification_required'
  message: string
  gameLogin: string
  requiresPasswordUpdate: boolean
}

export function getAccountMigrationStatus() {
  return apiRequest<AccountMigrationStatus>('/api/account-migration/status')
}

export function startAccountMigration(input: StartAccountMigrationInput) {
  return apiRequest<StartAccountMigrationResponse>('/api/account-migration/start', {
    body: input,
    method: 'POST',
  })
}

export function completeAccountMigration(input: CompleteAccountMigrationInput) {
  return apiRequest<CompleteAccountMigrationResponse>('/api/account-migration/complete', {
    body: input,
    method: 'POST',
  })
}
