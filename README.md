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
- Atualização segura de contas antigas, com sessão temporária httpOnly

Não inclui gateway real de pagamento, Mercado Pago, Stripe, entrega no jogo, carrinho, painel admin, OAuth, 2FA/MFA ou provedor real de e-mail.

## Loja de UP e Escala

- A Loja usa `store_packages` como fonte da verdade de preco, moeda e quantidade de UP.
- O frontend envia somente o codigo do pacote ao criar pedido; preco e UP nao sao confiados ao frontend.
- `POST /orders` cria pedido `pending_payment` e pagamento `pending`; nao aprova pagamento.
- A aprovacao de pagamento fica somente na funcao interna `approvePaymentFromVerifiedWebhook`, preparada para webhook validado futuro.
- Compras aprovadas no Site Universe somam UP ao ciclo ativo da escala por `user_reward_cycle_progress_events`.
- O UP acumulado da escala e separado do UP dentro do jogo.
- Cada rank pode ser resgatado uma vez por ciclo em `user_reward_tier_claims`.
- Ranks precisam ser resgatados em sequencia.
- O resgate do Rank 6 encerra o ciclo atual e cria um novo ciclo ativo com `accumulated_up = 0`.
- `game_item_id` e interno em `reward_tier_items` e nao aparece nas respostas publicas.
- A entrega real no GF fica para etapa futura via um servico de integracao de jogo; esta etapa nao chama `age_insertitem` nem acessa bases GF.
- Nao ha gateway real, Mercado Pago, Stripe, entrega no GF, painel admin ou integracao com gf_ms/gf_ls/FFAccount/tb_user/pvalues nesta etapa.

## Atualização de Conta Antiga

- A rota pública `/atualizar-conta` inicia o fluxo de atualização de contas antigas.
- A primeira etapa envia somente login do jogo e senha atual para `POST /api/account-migration/start`.
- Se a conta for validada futuramente por um serviço GF interno, o backend cria uma sessão temporária em cookie httpOnly.
- A segunda etapa usa `POST /api/account-migration/complete` para cadastrar e-mail e nova senha no Site Universe.
- `GET /api/account-migration/status` informa apenas se existe uma sessão temporária válida.
- O frontend não salva senha em URL, `localStorage` ou `sessionStorage`.
- O backend não expõe `idnum`, hash de senha, `pwd`, `pvalues`, `bonus` ou campos internos GF.
- O adaptador GF está intencionalmente bloqueado até o formato real de senha/acesso ser confirmado; por isso credenciais antigas não são aceitas nesta etapa.

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
ACCOUNT_MIGRATION_COOKIE_NAME=site_universe_migration
ACCOUNT_MIGRATION_SESSION_TTL_MINUTES=15
ACCOUNT_MIGRATION_RATE_LIMIT_MAX=5
ACCOUNT_MIGRATION_RATE_LIMIT_WINDOW=15 minutes
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
- `/atualizar-conta`
- `/painel`
- `/painel/loja`
- `/painel/recompensas`
- `/dashboard`
- `/dashboard/store`
- `/dashboard/rewards`
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

Backend Loja e Recompensas:

- `GET /api/store/packages`
- `GET /api/rewards/scale`
- `POST /api/rewards/tiers/:tierCode/claim`
- `POST /orders`

Backend Atualização de Conta Antiga:

- `POST /api/account-migration/start`
- `POST /api/account-migration/complete`
- `GET /api/account-migration/status`

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
npx prisma migrate status
npm run prisma:generate
```
