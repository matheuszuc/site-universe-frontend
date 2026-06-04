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
