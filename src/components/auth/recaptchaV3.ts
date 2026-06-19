// reCAPTCHA v3 (score, invisivel). O script e carregado no index.html via
// <script src=".../api.js?render=%VITE_RECAPTCHA_SITE_KEY%">. Aqui apenas
// executamos a verificacao sob demanda, no submit de Login e Registro.

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined

// VITE_RECAPTCHA_ENABLED=false desativa explicitamente (bypass de dev).
// Ausente ou qualquer outro valor = ativo sempre que a SITE_KEY existir.
const EXPLICITLY_DISABLED = import.meta.env.VITE_RECAPTCHA_ENABLED === 'false'

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

/** True quando o reCAPTCHA esta ativo e um token deve ser obtido/enviado. */
export function isRecaptchaRequired(): boolean {
  return Boolean(SITE_KEY) && !EXPLICITLY_DISABLED
}

/**
 * Executa o reCAPTCHA v3 para a acao informada e devolve o token.
 * Retorna undefined quando o reCAPTCHA esta desativado (dev).
 * Lanca se o script ainda nao carregou ou a execucao falhar.
 */
export async function executeRecaptcha(action: string): Promise<string | undefined> {
  if (!isRecaptchaRequired()) {
    return undefined
  }

  const grecaptcha = window.grecaptcha

  if (!grecaptcha || !SITE_KEY) {
    throw new Error('reCAPTCHA v3 não carregado.')
  }

  await new Promise<void>((resolve) => grecaptcha.ready(resolve))

  return grecaptcha.execute(SITE_KEY, { action })
}
