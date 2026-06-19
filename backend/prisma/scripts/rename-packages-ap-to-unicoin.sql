-- Fase 5 — texto publico AP -> Unicoin.
-- O nome publico dos pacotes (store_packages.name) ainda traz "X AP"
-- (ex: "34.000 AP"), que aparece no painel/histatorico do usuario.
-- Troca apenas o sufixo " AP" por " Unicoin" no rotulo publico.
-- NAO altera code (ap_*), rewardType, currencyType nem pvalues (nomes tecnicos internos).
-- Idempotente: so afeta linhas cujo nome ainda termina em " AP".
UPDATE "store_packages"
SET "name" = regexp_replace("name", '\s*AP$', ' Unicoin'),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "name" LIKE '% AP';
