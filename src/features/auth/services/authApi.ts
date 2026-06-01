import type {
  AuthApiResult,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '../types/authTypes'
import { formMessages } from '../../../utils/formMessages'

const visualDelay = 550

function waitForVisualFeedback() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, visualDelay)
  })
}

/*
  TODO: integrar com backend real.
  A senha NÃO deve ser hasheada no frontend.
  O backend será responsável por validar a senha, aplicar hash seguro com
  Argon2id/bcrypt e salvar apenas o hash.

  Futuramente o backend também deve validar autenticação, sessão, CSRF,
  rate limit, permissões, tokens de e-mail de uso único e logs de tentativa.
*/
export async function loginUser(_payload: LoginFormValues): Promise<AuthApiResult> {
  await waitForVisualFeedback()

  return {
    ok: true,
    message: 'Login enviado com sucesso.',
  }
}

export async function registerUser(_payload: RegisterFormValues): Promise<AuthApiResult> {
  await waitForVisualFeedback()

  return {
    ok: true,
    message: 'Cadastro recebido. Verifique seu e-mail para continuar.',
  }
}

export async function resendVerificationEmail(_email?: string): Promise<AuthApiResult> {
  await waitForVisualFeedback()

  return {
    ok: true,
    message: formMessages.resendVerification,
  }
}

export async function requestPasswordReset(_payload: ForgotPasswordFormValues): Promise<AuthApiResult> {
  await waitForVisualFeedback()

  return {
    ok: true,
    message: formMessages.forgotPassword,
  }
}

export async function resetPassword(_payload: ResetPasswordFormValues, _token?: string | null): Promise<AuthApiResult> {
  await waitForVisualFeedback()

  return {
    ok: true,
    message: 'Senha redefinida com sucesso.',
  }
}
