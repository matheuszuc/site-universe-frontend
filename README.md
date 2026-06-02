# Site Universe

Frontend e backend do módulo inicial de autenticação do Site Universe.

## Escopo atual

Este módulo cobre:

- Home
- Login
- Registro
- Verificação de e-mail
- Recuperação de senha
- Redefinição de senha
- Painel do usuário protegido por sessão real

Não inclui pagamento, recompensas, integração com jogo, loja, carrinho, painel admin, OAuth, 2FA/MFA ou provedor real de e-mail.

## Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Zod

Backend:

- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Cookie httpOnly com sessão opaca
- CSRF no logout autenticado
- Argon2id para senha

## Como rodar localmente

Banco:

- PostgreSQL precisa estar rodando.
- Configure `DATABASE_URL` em `backend/.env`.

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
npm install
npm run dev
```

Depois abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Variáveis de ambiente

Frontend (`.env`):

```env
VITE_API_URL=http://localhost:3333
```

Backend (`backend/.env`):

```env
DATABASE_URL=
NODE_ENV=development
PORT=3333
FRONTEND_URL=http://localhost:5173
SESSION_COOKIE_NAME=site_universe_session
SESSION_TTL_DAYS=7
EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
RATE_LIMIT_GLOBAL_MAX=100
RATE_LIMIT_GLOBAL_WINDOW=1 minute
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW=1 minute
LOGIN_ACCOUNT_LOCK_MAX_FAILURES=5
LOGIN_ACCOUNT_LOCK_MINUTES=15
REGISTER_RATE_LIMIT_MAX=5
REGISTER_RATE_LIMIT_WINDOW=10 minutes
PASSWORD_RESET_RATE_LIMIT_MAX=5
PASSWORD_RESET_RATE_LIMIT_WINDOW=15 minutes
EMAIL_VERIFICATION_RATE_LIMIT_MAX=5
EMAIL_VERIFICATION_RATE_LIMIT_WINDOW=15 minutes
```

Não coloque valores reais de segredo no repositório.

## Fluxo de autenticação

- O frontend usa `VITE_API_URL` para chamar o backend.
- Todas as chamadas ao backend usam `credentials: "include"`.
- O frontend não salva token, não usa JWT e não lê cookie httpOnly.
- A sessão real é validada com `GET /auth/me`.
- Logout chama `GET /auth/csrf` e depois `POST /auth/logout` com `X-CSRF-Token`.
- Tokens de verificação e reset são enviados por link e salvos no backend apenas como hash.
- Em desenvolvimento, o backend mostra links de e-mail/reset no console. Em produção, configure um provedor real de e-mail.

## Rotas principais

Frontend:

- `/`
- `/login`
- `/register`
- `/verify-email`
- `/verify-email?token=...`
- `/forgot-password`
- `/reset-password?token=...`
- `/painel`
- `/dashboard`
- `/terms`
- `/privacy`

Backend Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/csrf`
- `POST /auth/resend-verification`
- `GET /auth/verify-email?token=...`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Validação antes de avançar

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend
npm run build
npx prisma validate
```
