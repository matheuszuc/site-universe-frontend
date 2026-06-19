-- Fase 2 — verificacao dos pedidos reportados (rodar contra o banco de PRODUCAO).
-- Confirma o estado REAL no backend, independente do que aparece no navegador do usuario.

-- 1) Pedidos + pagamentos
SELECT o."order_number",
       o."status"            AS order_status,
       o."paid_at"           AS order_paid_at,
       o."amount_cents",
       o."currency",
       p."status"            AS payment_status,
       p."raw_provider_status",
       p."approved_at"       AS payment_approved_at,
       p."provider",
       p."provider_payment_id"
FROM "orders" o
LEFT JOIN "payments" p ON p."order_id" = o."id"
WHERE o."order_number" IN (
  'SU-20260619-145455',
  'SU-20260619-299855',
  'SU-20260619-641697'
);

-- 2) Houve credito de carteira (Unicoin) para esses pedidos?
SELECT wt."order_id", wt."type", wt."status", wt."amount", wt."currency_type", wt."posted_at"
FROM "wallet_transactions" wt
JOIN "orders" o ON o."id" = wt."order_id"
WHERE o."order_number" IN (
  'SU-20260619-145455','SU-20260619-299855','SU-20260619-641697'
);

-- 3) Houve entrega no jogo (GameDelivery) para esses pedidos?
SELECT gd."order_id", gd."type", gd."status", gd."created_at"
FROM "game_deliveries" gd
JOIN "orders" o ON o."id" = gd."order_id"
WHERE o."order_number" IN (
  'SU-20260619-145455','SU-20260619-299855','SU-20260619-641697'
);

-- 4) Qualquer pagamento aprovado por volta do horario suspeito (2026-06-19T03:09:40Z)?
SELECT o."order_number", p."status", p."approved_at", p."raw_provider_status"
FROM "payments" p
JOIN "orders" o ON o."id" = p."order_id"
WHERE p."approved_at" BETWEEN '2026-06-19T03:00:00Z' AND '2026-06-19T03:20:00Z';
