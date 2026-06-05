export type RewardTierStatus = 'locked' | 'eligible' | 'claimed' | 'delivery_pending' | 'delivered'

export type RewardItem = {
  name: string
  quantity: number
  description?: string
  imageUrl?: string
}

export type RewardTier = {
  code: string
  name: string
  boxName: string
  requiredUpTotal: number
  status: RewardTierStatus
  description: string
  items: RewardItem[]
}

export const officialRewardTierThresholds: Record<string, number> = {
  rank_1: 3000,
  rank_2: 7000,
  rank_3: 12000,
  rank_4: 18000,
  rank_5: 24000,
  rank_6: 30000,
}

export function getRewardTierRankNumber(tier: { code: string; name?: string }) {
  return tier.code.match(/rank[_-]?(\d+)/i)?.[1] ?? tier.name?.match(/\d+/)?.[0] ?? '1'
}

export function getRewardTierPublicTitle(tier: { code: string; name?: string }) {
  return `Rank ${getRewardTierRankNumber(tier)}`
}

export function getRewardTierRequiredAp(tier: { code: string; requiredUpTotal: number }) {
  return officialRewardTierThresholds[tier.code] ?? tier.requiredUpTotal
}
