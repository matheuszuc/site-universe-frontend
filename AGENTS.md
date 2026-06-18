# Instruções para agentes de IA — Site Universe

Responda sempre em português do Brasil.

Este projeto é o Site Universe — plataforma web completa
para servidor privado de Grand Fantasia.

## Stack

Frontend: React + Vite + TypeScript + Tailwind CSS
Backend: Fastify + TypeScript + Prisma + PostgreSQL
Auth: sessão httpOnly segura (cookie opaco, sem JWT)
Pagamento: Asaas Pix (único método aceito)
E-mail: Resend
Captcha: Google reCAPTCHA v2

## O que já está implementado e NÃO deve ser alterado

- Autenticação completa (login, registro, verificação de e-mail,
  recuperação de senha, redefinição de senha)
- Sessão segura com cookie httpOnly, CSRF, argon2id
- reCAPTCHA no login, registro e migração de conta
- Painel do usuário (dashboard, saldo, histórico)
- Loja de Unicoin com pacotes configuráveis
- Pagamento Pix via Asaas com webhook server-to-server
- Idempotência de pagamento e entrega (FOR UPDATE + unique constraints)
- Escala de Recompensas com ciclos, carry-over e resgate
- Integração com banco do jogo GF (gf_ms + gf_ls)
- Painel Admin somente leitura (usuários, pedidos, entregas, auditoria)
- Atualização de conta legada (/atualizar-conta)
- i18n com 4 idiomas (pt-BR, en-US, es, fr)
- rate limit em todos os endpoints sensíveis
- AdminRoute e ProtectedRoute no frontend

## Regras obrigatórias

- O frontend NUNCA decide autenticação, saldo, pagamento ou recompensa.
- O backend SEMPRE valida sessão, usuário, permissões e regras sensíveis.
- userId vem sempre da sessão validada, nunca do body ou params.
- Não usar localStorage para segurança real.
- Não fazer hash de senha no frontend.
- Não enviar e-mail diretamente pelo frontend.
- Não alterar schema Prisma ou migrations sem necessidade real.
- Não alterar box_game_item_id dos ranks (60045–60050).
- Não alterar thresholds da escala de recompensas.
- Não adicionar ações de escrita no painel admin.
- Não alterar fluxo de webhook, idempotência ou aprovação de pagamento.
- O provider de pagamento é SOMENTE Asaas Pix. Mercado Pago,
  Banco Inter e OpenPix NÃO são usados.
- Role ADMIN só pode ser atribuída via script:
  npm run admin:promote -- email@exemplo.com
- GAME_DELIVERY_ENABLED=false em staging. Somente true em produção
  com banco GF configurado.

## Pendências conhecidas antes de produção

- Coletar CPF/CNPJ do usuário para criação de customer no Asaas
  (campo payerCpfCnpj em CreatePixPaymentInput já existe)
- Configurar domínio verificado no Resend (EMAIL_FROM com domínio próprio)
- Registrar domínio de produção no Google reCAPTCHA
