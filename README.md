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

Não inclui gateway de pagamento em produção, Stripe, entrega no jogo, carrinho, painel admin, OAuth, 2FA/MFA ou provedor real de e-mail.

## Loja de AP e Escala

- A Loja usa `store_packages` como fonte da verdade de preco, moeda e quantidade de AP.
- O frontend envia somente o codigo do pacote ao criar pedido; preco e AP nao sao confiados ao frontend.
- A tela da loja carrega pacotes por `GET /api/store/packages`.
- `POST /orders` cria pedido `pending_payment` e pagamento `pending`; nao aprova pagamento.
- A criacao de pedido envia apenas `packageCode` e `Idempotency-Key`.
- `GET /orders` lista somente os últimos pedidos do usuário logado, sem aceitar `userId` do frontend.
- A tela de Histórico/Atividades mostra pedidos reais de AP e estado vazio quando não houver pedidos.
- O painel mostra saldo AP a partir de `/users/me/dashboard`.
- O Mercado Pago Pix fica habilitado somente em modo sandbox quando as variáveis do provider estiverem configuradas no backend.
- Se a cobranca Pix for criada via Mercado Pago Orders API, `POST /orders` retorna apenas dados publicos do Pix, como `pix.pixCopiaECola`, `pix.qrCodeImage`, `pix.status`, `order.orderNumber` e `pix.expiresAt`; caso contrario, o pedido fica pendente e a UI mostra pagamento Pix indisponivel.
- `GET /orders/:orderNumber/status` permite ao usuário atualizar o status do próprio pedido; a confirmação continua sendo server-to-server no backend.
- O webhook público `POST /webhooks/mercado-pago` valida a assinatura recebida, consulta o pagamento server-to-server e só então chama `approvePaymentFromVerifiedWebhook`.
- A aprovacao de pagamento fica somente na funcao interna `approvePaymentFromVerifiedWebhook`, após validação real do provider.
- Compras aprovadas no Site Universe somam AP ao ciclo ativo da escala por `user_reward_cycle_progress_events`.
- O AP acumulado da escala e separado do AP dentro do jogo.
- A tela da escala carrega progresso, status dos ranks e itens das caixas por `GET /api/rewards/scale`.
- Cada rank pode ser resgatado uma vez por ciclo em `user_reward_tier_claims`.
- O resgate de caixa usa `POST /api/rewards/tiers/:tierCode/claim` com `Idempotency-Key` e nao entrega item no GF.
- Ranks precisam ser resgatados em sequencia.
- O resgate do Rank 6 encerra o ciclo atual e cria um novo ciclo ativo com `accumulated_up = 0`.
- `game_item_id` e interno em `reward_tier_items` e nao aparece nas respostas publicas.
- A entrega real no GF fica para etapa futura via um servico de integracao de jogo; esta etapa nao chama `age_insertitem` nem acessa bases GF.
- Os nomes internos `up_amount`, `required_up_total` e `accumulated_up` continuam por compatibilidade de schema, mas a exibicao publica usa AP.
- Nao ha gateway alternativo, entrega no GF, painel admin ou integracao com gf_ms/gf_ls/FFAccount/tb_user/pvalues nesta etapa.

## Atualização de Conta Antiga

- A rota pública `/atualizar-conta` inicia o fluxo de atualização de contas antigas.
- A primeira etapa envia somente login do jogo e senha atual para `POST /api/account-migration/start`.
- O login antigo aceita apenas letras e números (`^[A-Za-z0-9]+$`).
- O backend valida a senha antiga consultando `gf_ms.tb_user` pelo campo `mid` e `gf_ls.accounts` pelo campo `username`.
- O MD5 da senha digitada é aceito se bater com `gf_ls.accounts.password`, `gf_ms.tb_user.password` ou `gf_ms.tb_user.pwd`.
- Se a conta for validada, o backend cria uma sessão temporária em cookie httpOnly, com expiração configurada em `ACCOUNT_MIGRATION_SESSION_TTL_MINUTES`.
- A segunda etapa usa `POST /api/account-migration/complete` para cadastrar e-mail e nova senha no Site Universe.
- A nova senha precisa ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.
- Ao concluir, a senha do Site Universe é salva com o hash moderno do backend; MD5 é usado somente para compatibilidade com o Grand Fantasia.
- O backend atualiza `gf_ms.tb_user.password`, `gf_ms.tb_user.pwd` e `gf_ls.accounts.password` com o mesmo MD5 da nova senha.
- O backend não altera `gf_ls.accounts.charpassword`, `use_charpassword`, `pvalues`, `bonus`, AP/P ou itens.
- Cada conta GF só pode concluir a migração uma vez; depois disso `/atualizar-conta` não pode trocar e-mail ou senha dessa conta.
- Após migrada, mudanças futuras devem ocorrer pelo login normal, recuperação de senha, painel logado ou suporte/admin.
- `GET /api/account-migration/status` informa apenas se existe uma sessão temporária válida.
- O frontend não salva senha em URL, `localStorage` ou `sessionStorage`.
- O backend não expõe `idnum`, hash de senha, `pwd`, `pvalues`, `bonus` ou campos internos GF.

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
GF_DB_HOST=
GF_DB_PORT=5432
GF_DB_USER=
GF_DB_PASSWORD=
GF_DB_NAME=gf_ms
GF_ACCOUNT_DB_NAME=gf_ls
GF_DB_SSL=false
```

As variáveis do provider Pix ficam documentadas apenas em `backend/.env.example`, sem valores reais. Não coloque valores reais de segredo no repositório.

## Teste local da migração GF

1. Configure `DATABASE_URL` para o banco do Site Universe.
2. Configure `GF_DB_HOST`, `GF_DB_PORT`, `GF_DB_USER`, `GF_DB_PASSWORD`, `GF_DB_NAME=gf_ms`, `GF_ACCOUNT_DB_NAME=gf_ls` e `GF_DB_SSL`.
3. Rode as migrations e gere o Prisma Client no backend.
4. Inicie backend e frontend.
5. Acesse `/atualizar-conta`.
6. Informe um login existente em `gf_ms.tb_user.mid` e `gf_ls.accounts.username`.
7. Informe e-mail, nova senha forte e confirmação.
8. Confira que `game_accounts` recebeu `game_login`, `game_account_id`, `linked_at` e `migrated_at`.
9. Confira que `gf_ms.tb_user.password`, `gf_ms.tb_user.pwd` e `gf_ls.accounts.password` foram atualizados para o mesmo MD5 da nova senha.
10. Confira que `gf_ls.accounts.charpassword` e `use_charpassword` não foram alterados.
11. Tente iniciar novamente com o mesmo login GF e confirme a mensagem de conta já atualizada.

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
- `GET /orders`
- `GET /orders/:orderNumber/status`
- `POST /orders`
- `POST /webhooks/mercado-pago`

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
