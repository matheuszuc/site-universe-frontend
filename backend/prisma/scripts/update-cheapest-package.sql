-- Atualiza o pacote mais barato da loja (antes: R$ 1,00 / 100 Unicoin -> code ap_100).
-- Novo valor: R$ 10,00 (1000 centavos) e 1.000 Unicoin.
-- O WHERE price_cents = 100 atinge somente o pacote ap_100 (unico com esse preco).
-- Nao altera os demais pacotes.
UPDATE "store_packages"
SET "price_cents" = 1000,
    "up_amount" = 1000,
    "name" = '1.000 Unicoin',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "price_cents" = 100;
