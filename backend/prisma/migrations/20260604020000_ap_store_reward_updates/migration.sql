UPDATE "store_packages"
SET "code" = data."code",
    "name" = data."name",
    "up_amount" = data."up_amount",
    "price_cents" = data."price_cents",
    "currency" = 'BRL',
    "is_active" = true,
    "display_order" = data."display_order",
    "metadata" = data."metadata"::jsonb,
    "updated_at" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('00000000-0000-0000-0000-000000000101'::uuid, 'ap_100', '100 AP', 100, 100, 1, '{"publicBadge": null}'),
    ('00000000-0000-0000-0000-000000000102'::uuid, 'ap_2700', '2.700 AP', 2700, 2500, 2, '{"publicBadge": "Mais popular"}'),
    ('00000000-0000-0000-0000-000000000103'::uuid, 'ap_5300', '5.300 AP', 5300, 5000, 3, '{}'),
    ('00000000-0000-0000-0000-000000000104'::uuid, 'ap_10800', '10.800 AP', 10800, 10000, 4, '{}'),
    ('00000000-0000-0000-0000-000000000105'::uuid, 'ap_22000', '22.000 AP', 22000, 20000, 5, '{"publicBadge": "Melhor valor"}'),
    ('00000000-0000-0000-0000-000000000106'::uuid, 'ap_34000', '34.000 AP', 34000, 30000, 6, '{}')
) AS data("id", "code", "name", "up_amount", "price_cents", "display_order", "metadata")
WHERE "store_packages"."id" = data."id";

UPDATE "reward_tiers"
SET "required_up_total" = data."required_up_total",
    "updated_at" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('rank_1', 3000),
    ('rank_2', 7000),
    ('rank_3', 12000),
    ('rank_4', 18000),
    ('rank_5', 24000),
    ('rank_6', 30000)
) AS data("code", "required_up_total")
WHERE "reward_tiers"."code" = data."code";

UPDATE "reward_tier_items"
SET "item_name" = data."item_name",
    "item_description" = data."item_description",
    "quantity" = data."quantity",
    "updated_at" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('00000000-0000-0000-0000-000000002001'::uuid, 'Caixa Rank 1', 'Caixa de recompensas do Rank 1.', 1),
    ('00000000-0000-0000-0000-000000002002'::uuid, 'Caixa Rank 2', 'Caixa de recompensas do Rank 2.', 1),
    ('00000000-0000-0000-0000-000000002003'::uuid, 'Caixa Rank 3', 'Caixa de recompensas do Rank 3.', 1),
    ('00000000-0000-0000-0000-000000002004'::uuid, 'Caixa Rank 4', 'Caixa de recompensas do Rank 4.', 1),
    ('00000000-0000-0000-0000-000000002005'::uuid, 'Caixa Rank 5', 'Caixa de recompensas do Rank 5.', 1),
    ('00000000-0000-0000-0000-000000002006'::uuid, 'Caixa Rank 6', 'Caixa de recompensas do Rank 6.', 1)
) AS data("id", "item_name", "item_description", "quantity")
WHERE "reward_tier_items"."id" = data."id";
