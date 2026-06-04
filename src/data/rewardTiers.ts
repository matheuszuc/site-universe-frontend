export type RewardTierStatus = 'locked' | 'eligible' | 'claimed' | 'delivery_pending' | 'delivered'

export type RewardItem = {
  name: string
  quantity: number
  description?: string
}

export type RewardOption = {
  code: string
  name: string
  description?: string
  items: RewardItem[]
}

export type RewardTier = {
  code: string
  name: string
  requiredUpTotal: number
  status: RewardTierStatus
  description: string
  items?: RewardItem[]
  options?: RewardOption[]
}

export const currentCycleUp = 42000

export const rewardTiers: RewardTier[] = [
  {
    code: 'rank_1',
    name: 'Rank 1',
    requiredUpTotal: 10000,
    status: 'claimed',
    description: 'Primeira recompensa do ciclo, liberada ao iniciar sua progressão de UP.',
    items: [
      {
        name: 'Item de recompensa',
        quantity: 1,
        description: 'Recompensa visual principal do rank.',
      },
      {
        name: 'Poção especial',
        quantity: 5,
        description: 'Bônus consumível previsto para etapa futura.',
      },
      {
        name: 'Caixa surpresa',
        quantity: 2,
      },
    ],
  },
  {
    code: 'rank_2',
    name: 'Rank 2',
    requiredUpTotal: 20000,
    status: 'eligible',
    description: 'Pacote intermediário com itens fixos para quem avançou no ciclo.',
    items: [
      {
        name: 'Cristal de aprimoramento',
        quantity: 3,
      },
      {
        name: 'Pergaminho raro',
        quantity: 2,
        description: 'Item planejado para recompensa futura.',
      },
      {
        name: 'Baú de recursos',
        quantity: 1,
      },
      {
        name: 'Poção especial',
        quantity: 5,
      },
      {
        name: 'Selo de progresso',
        quantity: 1,
      },
    ],
  },
  {
    code: 'rank_3',
    name: 'Rank 3',
    requiredUpTotal: 35000,
    status: 'eligible',
    description: 'Rank com escolha visual entre dois conjuntos de recompensas.',
    options: [
      {
        code: 'set_attack',
        name: 'Opção 1',
        description: 'Conjunto focado em avanço ofensivo.',
        items: [
          { name: 'Item A', quantity: 1 },
          { name: 'Item B', quantity: 2 },
          { name: 'Item C', quantity: 5 },
          { name: 'Caixa surpresa', quantity: 2 },
          { name: 'Cristal de aprimoramento', quantity: 3 },
        ],
      },
      {
        code: 'set_support',
        name: 'Opção 2',
        description: 'Conjunto focado em recursos e sustentação.',
        items: [
          { name: 'Item D', quantity: 1 },
          { name: 'Item E', quantity: 2 },
          { name: 'Item F', quantity: 5 },
          { name: 'Poção especial', quantity: 5 },
          { name: 'Baú de recursos', quantity: 1 },
        ],
      },
    ],
  },
  {
    code: 'rank_4',
    name: 'Rank 4',
    requiredUpTotal: 50000,
    status: 'locked',
    description: 'Recompensa avançada desbloqueada ao acumular mais UP no ciclo.',
    items: [
      {
        name: 'Item de recompensa',
        quantity: 1,
      },
      {
        name: 'Caixa especial',
        quantity: 2,
      },
      {
        name: 'Poção especial',
        quantity: 10,
      },
    ],
  },
  {
    code: 'rank_5',
    name: 'Rank 5',
    requiredUpTotal: 75000,
    status: 'locked',
    description: 'Etapa superior do ciclo, preparada para recompensas maiores.',
    items: [
      {
        name: 'Baú lendário',
        quantity: 1,
      },
      {
        name: 'Cristal de aprimoramento',
        quantity: 8,
      },
      {
        name: 'Selo de progresso',
        quantity: 3,
      },
    ],
  },
  {
    code: 'rank_6',
    name: 'Rank 6',
    requiredUpTotal: 100000,
    status: 'locked',
    description: 'Fechamento do ciclo atual. Futuramente, o resgate inicia um novo ciclo.',
    options: [
      {
        code: 'set_legendary_a',
        name: 'Opção 1',
        description: 'Conjunto final com foco em itens raros.',
        items: [
          { name: 'Item lendário A', quantity: 1 },
          { name: 'Item lendário B', quantity: 1 },
          { name: 'Caixa surpresa', quantity: 5 },
        ],
      },
      {
        code: 'set_legendary_b',
        name: 'Opção 2',
        description: 'Conjunto final com foco em recursos.',
        items: [
          { name: 'Item lendário C', quantity: 1 },
          { name: 'Baú lendário', quantity: 2 },
          { name: 'Cristal de aprimoramento', quantity: 12 },
        ],
      },
    ],
  },
]
