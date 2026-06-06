import { z } from "zod";

export const rewardTierParamsSchema = z.object({
  tierCode: z.string().trim().min(1).max(80)
});

export const claimRewardTierBodySchema = z.object({}).strict();

export type RewardTierParams = z.infer<typeof rewardTierParamsSchema>;
