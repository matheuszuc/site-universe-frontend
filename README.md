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

Não inclui Stripe, Banco Inter, carrinho, painel admin, OAuth, 2FA/MFA ou provedor real de e-mail.

## Loja de AP e Escala

- A Loja usa `store_packages` como fonte da verdade de preco, moeda e quantidade de AP.
- O frontend envia somente o codigo do pacote ao criar pedido; preco e AP nao sao confiados ao frontend.
- A tela da loja carrega pacotes por `GET /api/store/packages`.
- `POST /orders` cria pedido `pending_payment` e pagamento `pending`; nao aprova pagamento.
- A criacao de pedido envia apenas `packageCode` e `Idempotency-Key`.
- `GET /orders` lista somente os últimos pedidos do usuário logado, sem aceitar `userId` do frontend.
- A tela de Histórico/Atividades mostra pedidos reais de AP e estado vazio quando não houver pedidos.
- O painel mostra saldo AP a partir de `/users/me/dashboard`.
- O Site Universe aceita **somente Pix**, via **Asaas** (`PAYMENT_PROVIDER=asaas`). Não há cartão, boleto, link com múltiplos métodos nem seletor de método. O método oficial é sempre Pix (`billingType=PIX`), definido no backend.
- A cobrança Pix fica habilitada quando `ASAAS_ACCESS_TOKEN` e `ASAAS_BASE_URL` estão configurados no backend. Em produção, a ausência de `ASAAS_ACCESS_TOKEN` derruba o startup.
- Quando a cobrança Pix é criada no Asaas, `POST /orders` retorna apenas dados públicos do Pix, como `pix.pixCopiaECola` (copia e cola), `pix.qrCodeImage` (QR Code), `pix.status`, `order.orderNumber` e `pix.expiresAt`; caso contrário, o pedido fica pendente e a UI mostra pagamento Pix indisponível.
- O `externalReference` da cobrança Asaas é sempre o `orderNumber` interno, usado para reconciliar o webhook ao pedido local sem confiar no cliente.
- `GET /orders/:orderNumber/status` permite ao usuário atualizar o status do próprio pedido; a confirmação continua sendo server-to-server no backend.
- O webhook público `POST /webhooks/asaas` valida o header `asaas-access-token` (quando `ASAAS_WEBHOOK_TOKEN` está configurado), reconsulta a cobrança server-to-server no Asaas e só então chama `approvePaymentFromVerifiedWebhook`. Eventos que não sejam Pix recebido/confirmado não aprovam nada.
- A aprovacao de pagamento fica somente na funcao interna `approvePaymentFromVerifiedWebhook`, após validação real do provider.
- Compras aprovadas no Site Universe somam AP ao ciclo ativo da escala por `user_reward_cycle_progress_events`.
- Compras aprovadas tambem criam `game_deliveries` do tipo `CREDIT_AP` para credito em `gf_ms.tb_user.pvalues`.
- O backend usa somente o pedido/pagamento aprovado para definir AP; o frontend nao envia AP, preco, `userId` ou conta GF.
- A tela da escala carrega progresso, status dos ranks e itens das caixas por `GET /api/rewards/scale`.
- Cada rank pode ser resgatado uma vez por ciclo em `user_reward_tier_claims`.
- O resgate de caixa usa `POST /api/rewards/tiers/:tierCode/claim` com `Idempotency-Key` e cria `game_deliveries` do tipo `REWARD_BOX`.
- Ranks liberados podem ser resgatados em qualquer ordem; cada rank depende apenas da propria meta de AP no ciclo.
- O ciclo fecha somente quando todos os ranks ativos do ciclo forem resgatados.
- Ao fechar o ciclo, o backend preserva excedente com `carryOverAp = Math.max(accumulated_up - 30000, 0)`.
- `box_game_item_id` em `reward_tiers` guarda o item_id da caixa unica entregue no item mall do jogo.
- `game_item_id` em `reward_tier_items` continua interno para os itens visuais e nao aparece nas respostas publicas.
- Com `GAME_DELIVERY_ENABLED=false`, o backend registra `game_deliveries`, mas nao escreve no banco GF.
- Com `GAME_DELIVERY_ENABLED=true`, o backend processa `CREDIT_AP` em `gf_ms.tb_user` e `REWARD_BOX` em `gf_ls.item_receivable`.
- Os nomes internos `up_amount`, `required_up_total` e `accumulated_up` continuam por compatibilidade de schema, mas a exibicao publica usa AP.
- Nao ha gateway alternativo, Banco Inter, painel admin ou integracao com FFAccount nesta etapa.

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
APP_PUBLIC_URL=http://localhost:5173
SESSION_COOKIE_NAME=site_universe_session
SESSION_TTL_DAYS=7
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="Site Universe <onboarding@resend.dev>"
EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24
EMAIL_VERIFICATION_EXPIRES_MINUTES=30
EMAIL_VERIFICATION_CODE_LENGTH=6
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
EMAIL_VERIFICATION_MAX_PER_HOUR=5
EMAIL_REQUIRE_VERIFIED=true
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
GAME_DELIVERY_ENABLED=false
```

As variáveis do provider Pix (Asaas) ficam documentadas apenas em `backend/.env.example`, sem valores reais — `PAYMENT_PROVIDER`, `ASAAS_ACCESS_TOKEN`, `ASAAS_BASE_URL`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN` e `ASAAS_PIX_DUE_DAYS`. Não coloque valores reais de segredo no repositório e nunca exponha o `ASAAS_ACCESS_TOKEN`/`ASAAS_WEBHOOK_TOKEN` no frontend (sem prefixo `VITE_`). O sistema aceita **somente Pix**.

#### Webhook e teste de Pix (Asaas)

- Configure no painel do Asaas o webhook para `POST {APP_PUBLIC_API}/webhooks/asaas` e defina o mesmo token em `ASAAS_WEBHOOK_TOKEN`. O Asaas envia esse token no header `asaas-access-token`; sem token correto o webhook é recusado (403).
- A autenticação das chamadas à API usa o header `access_token` (não `Authorization: Bearer`).
- Teste de Pix em sandbox: defina `ASAAS_ENV=sandbox`, `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3` e um `ASAAS_ACCESS_TOKEN` de teste; crie um pedido na loja, pague o QR Code/copia e cola de sandbox e confirme que o webhook credita o Unicoin uma única vez.
- **Pendência de produção:** o Asaas exige `cpfCnpj` para criar o customer. O site ainda não coleta CPF/CNPJ — o fluxo envia o customer sem esse campo e o Asaas rejeitará em produção até que o CPF/CNPJ passe a ser coletado no cadastro/checkout.

### Resend em desenvolvimento

Para testar envio real sem dominio verificado no Resend, use:

```env
EMAIL_PROVIDER=resend
EMAIL_FROM="Site Universe <onboarding@resend.dev>"
```

Com `onboarding@resend.dev`, o Resend permite envio apenas para o e-mail associado a propria conta Resend. Enviar para outro destinatario pode retornar `403 Testing domain restriction`.

Para producao, verifique um dominio proprio no Resend e troque `EMAIL_FROM` para um remetente desse dominio, por exemplo:

```env
EMAIL_FROM="Site Universe <noreply@seudominio.com>"
```

`RESEND_API_KEY` deve existir somente em `backend/.env`. Nao crie `VITE_RESEND_API_KEY`.

## Entregas ao Grand Fantasia

- `GF_DB_NAME=gf_ms` e usado para credito de AP em `tb_user.pvalues`, localizado por `tb_user.mid`.
- `GF_ACCOUNT_DB_NAME=gf_ls` e usado para inserir caixas em `item_receivable`.
- `GF_DB_SSL=false` e interpretado como boolean real; a string `"false"` nao ativa SSL.
- `GAME_DELIVERY_ENABLED=false` mantem entregas como `pending` em `game_deliveries` e nao escreve no GF.
- `GAME_DELIVERY_ENABLED=true` permite o processamento backend/worker das entregas no GF.
- O worker/processador interno nunca recebe `account_name`, AP ou `item_id` do frontend.
- AP vem do pedido aprovado no backend.
- A conta GF vem de `game_accounts.game_login` vinculada ao usuario.
- O item da caixa vem de `reward_tiers.box_game_item_id`.
- Para preencher IDs das caixas, atualize `reward_tiers.box_game_item_id` no banco ou em uma seed/migration:
  - `rank_1` / Escala Rank 1 = `TODO_ITEM_ID_RANK_1`
  - `rank_2` / Escala Rank 2 = `TODO_ITEM_ID_RANK_2`
  - `rank_3` / Escala Rank 3 = `TODO_ITEM_ID_RANK_3`
  - `rank_4` / Escala Rank 4 = `TODO_ITEM_ID_RANK_4`
  - `rank_5` / Escala Rank 5 = `TODO_ITEM_ID_RANK_5`
  - `rank_6` / Escala Rank 6 = `TODO_ITEM_ID_RANK_6`
- Enquanto `box_game_item_id` estiver vazio, o resgate retorna erro seguro: `Recompensa indisponivel no momento.`

Para processar pendentes manualmente:

```bash
cd backend
npm run game-deliveries:process
```

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
- `/download`
- `/login`
- `/register`
- `/verify-email`
- `/verify-email?token=...`
- `/verificar-email?token=...`
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
- `POST /auth/resend-verification-email`
- `GET /auth/verify-email?token=...`
- `POST /auth/verify-email-code`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Backend Loja e Recompensas:

- `GET /api/store/packages`
- `GET /api/rewards/scale`
- `POST /api/rewards/tiers/:tierCode/claim`
- `GET /orders`
- `GET /orders/:orderNumber/status`
- `POST /orders`
- `POST /webhooks/asaas`

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
npm run game-deliveries:process
```
