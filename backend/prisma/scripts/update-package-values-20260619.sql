-- Atualiza os valores de Unicoin (up_amount) e o nome (name) dos pacotes da loja.
-- Cada pacote e identificado pelo price_cents atual (valor em centavos de BRL),
-- que NAO muda — apenas a quantidade de Unicoin e o nome exibido sao atualizados.
--
-- Novos valores:
--   R$ 25,00  (2500 centavos)  -> 2.600 Unicoin
--   R$ 50,00  (5000 centavos)  -> 5.200 Unicoin
--   R$ 100,00 (10000 centavos) -> 10.400 Unicoin
--   R$ 200,00 (20000 centavos) -> 21.000 Unicoin
--   R$ 300,00 (30000 centavos) -> 33.000 Unicoin
--
-- O pacote de R$ 10,00 (1000 centavos / 1.000 Unicoin), ja ajustado em hotfix
-- anterior (update-cheapest-package.sql), NAO e tocado aqui.
--
-- Padrao de nome "X.XXX Unicoin" (ponto como separador de milhar), o mesmo
-- usado na hotfix anterior. NAO aplicar automaticamente em producao: revisar e
-- rodar manualmente.

UPDATE "store_packages"
SET "up_amount" = 2600,
    "name" = '2.600 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 2500;

UPDATE "store_packages"
SET "up_amount" = 5200,
    "name" = '5.200 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 5000;

UPDATE "store_packages"
SET "up_amount" = 10400,
    "name" = '10.400 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 10000;

UPDATE "store_packages"
SET "up_amount" = 21000,
    "name" = '21.000 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 20000;

UPDATE "store_packages"
SET "up_amount" = 33000,
    "name" = '33.000 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 30000;
