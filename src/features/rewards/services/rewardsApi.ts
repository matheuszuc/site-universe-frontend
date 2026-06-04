import { apiRequest } from '../../../services/api'
import type { RewardItem, RewardTier, RewardTierStatus } from '../../../data/rewardTiers'

type BackendRewardItem = {
  itemName: string
  itemDescription: string | null
  quantity: number
}

type BackendRewardTier = {
  code: string
  name: string
  requiredUpTotal: number
  displayOrder: number
  status: RewardTierStatus
  items: BackendRewardItem[]
}

type BackendRewardScaleResponse = {
  currentCycle: {
    cycleNumber: number
    accumulatedUp: number
    status: string
  }
  nextTier: {
    code: string
    name: string
    requiredUpTotal: number
    missingUp: number
  } | null
  tiers: BackendRewardTier[]
}

export type RewardScale = {
  currentCycle: {
    cycleNumber: number
    accumulatedAp: number
    status: string
  }
  nextRank: {
    code: string
    name: string
    requiredAp: number
    missingAp: number
  } | null
  tiers: RewardTier[]
}

function getBoxName(tierName: string) {
  return `Caixa ${tierName}`
}

function getRankNumber(tier: BackendRewardTier) {
  return tier.name.match(/\d+/)?.[0] ?? tier.code.match(/\d+/)?.[0] ?? '1'
}

function getFallbackBoxContents(tier: BackendRewardTier): RewardItem[] {
  const rankNumber = getRankNumber(tier)

  return [
    {
      name: `Cristais Rank ${rankNumber}`,
      quantity: Number(rankNumber),
      description: 'Conteúdo visual da caixa para este marco da escala.',
    },
    {
      name: 'Poção especial',
      quantity: Math.max(1, Number(rankNumber) * 2),
      description: 'Item de apoio exibido como referência pública da recompensa.',
    },
    {
      name: 'Bilhete de suporte',
      quantity: 1,
      description: 'Item visual complementar da caixa deste rank.',
    },
  ]
}

function normalizePublicName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function isDeliveredBoxItem(item: BackendRewardItem, boxName: string) {
  const itemName = normalizePublicName(item.itemName)
  const deliveredBoxName = normalizePublicName(boxName)

  return itemName === deliveredBoxName || /^caixa\s+rank\s+\d+/.test(itemName)
}

function normalizeRewardItems(tier: BackendRewardTier, boxName: string): RewardItem[] {
  const visualItems = tier.items
    .filter((item) => !isDeliveredBoxItem(item, boxName))
    .map((item) => ({
      name: item.itemName,
      quantity: item.quantity,
      description: item.itemDescription ?? undefined,
    }))

  return visualItems.length > 0 ? visualItems : getFallbackBoxContents(tier)
}

function normalizeTier(tier: BackendRewardTier): RewardTier {
  const boxName = getBoxName(tier.name)

  return {
    code: tier.code,
    name: tier.name,
    boxName,
    requiredUpTotal: tier.requiredUpTotal,
    status: tier.status,
    description: `${boxName} com recompensas deste marco da escala.`,
    items: normalizeRewardItems(tier, boxName),
  }
}

function normalizeScale(response: BackendRewardScaleResponse): RewardScale {
  return {
    currentCycle: {
      cycleNumber: response.currentCycle.cycleNumber,
      accumulatedAp: response.currentCycle.accumulatedUp,
      status: response.currentCycle.status,
    },
    nextRank: response.nextTier
      ? {
          code: response.nextTier.code,
          name: response.nextTier.name,
          requiredAp: response.nextTier.requiredUpTotal,
          missingAp: response.nextTier.missingUp,
        }
      : null,
    tiers: response.tiers.map(normalizeTier),
  }
}

function createIdempotencyKey(prefix: string) {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}:${randomId}`
}

export async function getRewardScale() {
  const response = await apiRequest<BackendRewardScaleResponse>('/api/rewards/scale')

  return normalizeScale(response)
}

export function claimRewardTier(tierCode: string) {
  return apiRequest<unknown>(`/api/rewards/tiers/${encodeURIComponent(tierCode)}/claim`, {
    body: {},
    headers: {
      'Idempotency-Key': createIdempotencyKey('reward_tier_claim'),
    },
    method: 'POST',
  })
}
