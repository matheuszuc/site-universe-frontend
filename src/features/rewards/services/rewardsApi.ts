import { apiRequest } from '../../../services/api'
import {
  getRewardTierPublicTitle,
  getRewardTierRankNumber,
  getRewardTierRequiredAp,
  type RewardItem,
  type RewardTier,
  type RewardTierStatus,
} from '../../../data/rewardTiers'

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

const publicBoxContentsByTierCode: Record<string, RewardItem[]> = {
  rank_1: [
    { name: 'Barros de Alquimia', quantity: 35 },
    { name: 'Gaias lvl 4', quantity: 10 },
    { name: 'Inscrição lvl 3 (+10)', quantity: 5 },
    { name: 'Trevo de Alquimia 100%', quantity: 2 },
    { name: 'Formão Cristal 100%', quantity: 5 },
    { name: 'Pedra da Amizade (+50% Mov. Speed)', quantity: 1, description: '15 dias' },
    { name: 'Encantamentos Lendário lvl 2', quantity: 20 },
    { name: 'Caixa de Amuleto XP (25%/50%/75%/100%)', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 100 },
  ],
  rank_2: [
    { name: 'Barros de Alquimia', quantity: 40 },
    { name: 'Gaias lvl 4', quantity: 30 },
    { name: 'Caixa de Pedras Critic - (Dano 10% e Taxa 1,8%)', quantity: 2 },
    { name: 'Legado à escolha (31-60)', quantity: 1 },
    { name: 'Mochila (30 slots)', quantity: 2 },
    { name: 'Mochila Sprite (20 slots)', quantity: 2 },
    { name: 'Talent Universe Coin', quantity: 2 },
    { name: 'Cartão VIP Sprite da Glória (LVL 1)', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 100 },
  ],
  rank_3: [
    { name: 'Barros Alquimia', quantity: 45 },
    { name: 'Caixa de Pedras Critic - (Dano 10% e Taxa 1,8%)', quantity: 2 },
    { name: 'Inscrição lvl 3 (+10)', quantity: 10 },
    { name: 'Trevo de Alquimia 100%', quantity: 5 },
    { name: 'Formão Cristal 100%', quantity: 10 },
    { name: 'Encantamentos Lendário lvl 2', quantity: 30 },
    { name: 'Talent Universe Coin', quantity: 2 },
    { name: 'Montaria Esquilo de CBT', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 100 },
  ],
  rank_4: [
    { name: 'Barros Alquimia', quantity: 50 },
    { name: 'Caixa de Pedras Critic - (Dano 10% e Taxa 1,8%)', quantity: 2 },
    { name: 'Encantamentos Lendário lvl 2', quantity: 50 },
    { name: 'Máscara de Combate (PVE) "Doce"', quantity: 1, description: '25 dias' },
    { name: 'Mochila (30 slots)', quantity: 2 },
    { name: 'Mochila Sprite (20 slots)', quantity: 2 },
    { name: 'Caixa de Fantasias Exclusiva (escolha 4 skins)', quantity: 1 },
    { name: 'Talent Universe Coin', quantity: 2 },
    { name: 'Montaria de Rena CBT', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 150 },
  ],
  rank_5: [
    { name: 'Barros Alquimia', quantity: 60 },
    { name: 'Caixa de Pedras Critic - (Dano 10% e Taxa 1,8%)', quantity: 2 },
    { name: 'Encantamentos Lendário lvl 2', quantity: 100 },
    { name: 'Mochila (30 slots)', quantity: 2 },
    { name: 'Mochila Sprite (20 slots)', quantity: 2 },
    { name: 'Caixa de Montaria Exclusiva (Escolhe x1)', quantity: 1 },
    { name: 'Caixa de Títulos Exclusivos', quantity: 1 },
    { name: 'Caixa de Núcleo Transitórios (escolha 1)', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 200 },
  ],
  rank_6: [
    { name: 'Barros Alquimia', quantity: 70 },
    { name: 'Surpresa GM Exclusiva', quantity: 1 },
    { name: 'Título "Senhor do Eclipse"', quantity: 1 },
    { name: 'Montaria de DG (125%)', quantity: 1 },
    { name: 'Cartão VIP Alquimia Nobre (LVL 2)', quantity: 1 },
    { name: 'Peças de Alquimia', quantity: 250 },
  ],
}

function getRankNumber(tier: BackendRewardTier) {
  return getRewardTierRankNumber(tier)
}

function getBoxName(tier: BackendRewardTier) {
  return `Escala Rank ${getRankNumber(tier)}`
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
  const publicItems = publicBoxContentsByTierCode[tier.code]

  if (publicItems) {
    return publicItems
  }

  const visualItems = tier.items
    .filter((item) => !isDeliveredBoxItem(item, boxName))
    .map((item) => ({
      name: item.itemName,
      quantity: item.quantity,
      description: item.itemDescription ?? undefined,
    }))

  return visualItems.length > 0
    ? visualItems
    : [
        {
          name: `Caixa do ${getRewardTierPublicTitle(tier)}`,
          quantity: 1,
          description: 'Conteúdo público da caixa deste rank.',
        },
      ]
}

function normalizeTier(tier: BackendRewardTier): RewardTier {
  const boxName = getBoxName(tier)
  const rankTitle = getRewardTierPublicTitle(tier)
  const requiredUpTotal = getRewardTierRequiredAp(tier)

  return {
    code: tier.code,
    name: rankTitle,
    boxName,
    requiredUpTotal,
    status: tier.status,
    description: `Recompensas do ${rankTitle}.`,
    items: normalizeRewardItems(tier, boxName),
  }
}

function normalizeScale(response: BackendRewardScaleResponse): RewardScale {
  const nextRankRequiredAp = response.nextTier
    ? getRewardTierRequiredAp(response.nextTier)
    : undefined

  return {
    currentCycle: {
      cycleNumber: response.currentCycle.cycleNumber,
      accumulatedAp: response.currentCycle.accumulatedUp,
      status: response.currentCycle.status,
    },
    nextRank: response.nextTier
      ? {
          code: response.nextTier.code,
          name: getRewardTierPublicTitle(response.nextTier),
          requiredAp: nextRankRequiredAp ?? response.nextTier.requiredUpTotal,
          missingAp: Math.max(
            0,
            (nextRankRequiredAp ?? response.nextTier.requiredUpTotal) -
              response.currentCycle.accumulatedUp,
          ),
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
