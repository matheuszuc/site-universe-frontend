import { apiRequest } from '../../../services/api'
import { formMessages } from '../../../utils/formMessages'
import type {
  AuthApiResult,
  AuthUser,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '../types/authTypes'

type AuthUserResponse = {
  user: AuthUser
}

type SuccessResponse = {
  success: true
  message: string
}

type CsrfResponse = {
  csrfToken: string
}

function toResult(response: SuccessResponse, fallbackMessage: string): AuthApiResult {
  return {
    ok: true,
    message: response.message || fallbackMessage,
  }
}

export const authApi = {
  async login(payload: LoginFormValues) {
    const response = await apiRequest<AuthUserResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    })

    return response.user
  },

  async register(payload: RegisterFormValues) {
    const response = await apiRequest<AuthUserResponse>('/auth/register', {
      method: 'POST',
      body: {
        name: payload.username,
        email: payload.email,
        password: payload.password,
      },
    })

    return response.user
  },

  async me() {
    const response = await apiRequest<AuthUserResponse>('/auth/me')
    return response.user
  },

  async getCsrfToken() {
    const response = await apiRequest<CsrfResponse>('/auth/csrf')
    return response.csrfToken
  },

  async logout() {
    const csrfToken = await this.getCsrfToken()

    await apiRequest<{ success: true }>('/auth/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })
  },

  async resendVerification(email: string) {
    const response = await apiRequest<SuccessResponse>('/auth/resend-verification-email', {
      method: 'POST',
      body: { email },
    })

    return toResult(response, formMessages.resendVerification)
  },

  async verifyEmail(token: string) {
    const response = await apiRequest<SuccessResponse>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
    )

    return toResult(response, 'E-mail verificado com sucesso.')
  },

  async verifyEmailCode(email: string, code: string) {
    const response = await apiRequest<SuccessResponse>('/auth/verify-email-code', {
      method: 'POST',
      body: { email, code },
    })

    return toResult(response, 'E-mail confirmado com sucesso.')
  },

  async forgotPassword(email: string) {
    const response = await apiRequest<SuccessResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })

    return toResult(response, formMessages.forgotPassword)
  },

  async resetPassword(token: string, password: string) {
    const response = await apiRequest<SuccessResponse>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    })

    return toResult(response, 'Senha redefinida com sucesso.')
  },
}

export async function loginUser(payload: LoginFormValues): Promise<AuthApiResult> {
  await authApi.login(payload)
  return {
    ok: true,
    message: 'Login realizado com sucesso.',
  }
}

export async function registerUser(payload: RegisterFormValues): Promise<AuthApiResult> {
  await authApi.register(payload)
  return {
    ok: true,
    message: 'Cadastro recebido. Verifique seu e-mail para continuar.',
  }
}

export async function resendVerificationEmail(email?: string): Promise<AuthApiResult> {
  if (!email) {
    return {
      ok: false,
      message: 'Informe o e-mail para reenviar a verificação.',
    }
  }

  return authApi.resendVerification(email)
}

export async function requestPasswordReset(
  payload: ForgotPasswordFormValues,
): Promise<AuthApiResult> {
  return authApi.forgotPassword(payload.email)
}

export async function resetPassword(
  payload: ResetPasswordFormValues,
  token?: string | null,
): Promise<AuthApiResult> {
  if (!token) {
    return {
      ok: false,
      message: 'Token inválido ou expirado.',
    }
  }

  return authApi.resetPassword(token, payload.password)
}
