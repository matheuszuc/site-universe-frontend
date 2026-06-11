-- Sets the real Grand Fantasia item IDs for each Reward Scale rank box.
-- Each rank delivers a unique box item to gf_ls.item_receivable.
-- These IDs were confirmed by the game team before production deploy.

UPDATE "reward_tiers"
SET
  "box_game_item_id" = data."box_game_item_id",
  "updated_at"       = CURRENT_TIMESTAMP
FROM (VALUES
  ('rank_1', 60045),
  ('rank_2', 60046),
  ('rank_3', 60047),
  ('rank_4', 60048),
  ('rank_5', 60049),
  ('rank_6', 60050)
) AS data(code, box_game_item_id)
WHERE "reward_tiers"."code" = data.code;
