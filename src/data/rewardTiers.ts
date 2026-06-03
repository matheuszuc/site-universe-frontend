export type RewardTierStatus = 'locked' | 'available' | 'claimed'

export type RewardTier = {
  id: string
  rank: number
  name: string
  requiredUp: number
  status: RewardTierStatus
}

export const currentCycleUp = 42000

export const rewardTiers: RewardTier[] = [
  {
    id: 'rank-1',
    rank: 1,
    name: 'Rank 1',
    requiredUp: 10000,
    status: 'claimed',
  },
  {
    id: 'rank-2',
    rank: 2,
    name: 'Rank 2',
    requiredUp: 20000,
    status: 'available',
  },
  {
    id: 'rank-3',
    rank: 3,
    name: 'Rank 3',
    requiredUp: 35000,
    status: 'available',
  },
  {
    id: 'rank-4',
    rank: 4,
    name: 'Rank 4',
    requiredUp: 50000,
    status: 'locked',
  },
  {
    id: 'rank-5',
    rank: 5,
    name: 'Rank 5',
    requiredUp: 75000,
    status: 'locked',
  },
  {
    id: 'rank-6',
    rank: 6,
    name: 'Rank 6',
    requiredUp: 100000,
    status: 'locked',
  },
]
