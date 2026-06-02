const DEFAULT_API_URL = 'http://localhost:3333'
const FALLBACK_ERROR_MESSAGE = 'Não foi possível concluir a ação. Tente novamente.'

type BackendErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

const friendlyMessagesByCode: Record<string, string> = {
  BAD_REQUEST: 'Dados inválidos. Revise as informações e tente novamente.',
  CONFLICT: 'Não foi possível criar a conta com os dados informados.',
  CSRF_FAILED: 'Não foi possível validar a sessão. Faça login novamente.',
  FORBIDDEN: 'Acesso negado.',
  INTERNAL_SERVER_ERROR: 'Não foi possível concluir a ação. Tente novamente.',
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  INVALID_OR_EXPIRED_TOKEN: 'Token inválido ou expirado.',
  LOGIN_BLOCKED_ACCOUNT_LOCKED: 'Muitas tentativas de login. Tente novamente mais tarde.',
  NOT_FOUND: 'Recurso não encontrado.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um instante e tente novamente.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  UNSUPPORTED_MEDIA_TYPE: 'Não foi possível enviar os dados. Tente novamente.',
}

export class ApiError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '')
}

function getSafeMessage(errorPayload: BackendErrorPayload | undefined, status: number) {
  const code = errorPayload?.error?.code

  if (code && friendlyMessagesByCode[code]) {
    return friendlyMessagesByCode[code]
  }

  if (status === 409) {
    return friendlyMessagesByCode.CONFLICT
  }

  if (status === 429) {
    return friendlyMessagesByCode.RATE_LIMITED
  }

  return errorPayload?.error?.message || FALLBACK_ERROR_MESSAGE
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return undefined
  }

  return response.json()
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return FALLBACK_ERROR_MESSAGE
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const hasBody = options.body !== undefined

  headers.set('Accept', 'application/json')

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    headers,
  })
  const payload = (await parseJsonResponse(response)) as T | BackendErrorPayload | undefined

  if (!response.ok) {
    const errorPayload = payload as BackendErrorPayload | undefined
    const code = errorPayload?.error?.code

    throw new ApiError(getSafeMessage(errorPayload, response.status), response.status, code)
  }

  return payload as T
}
