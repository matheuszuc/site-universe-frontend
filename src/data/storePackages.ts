export type StorePackage = {
  id: string
  upAmount: number
  priceLabel: string
  badge?: string
}

export const storePackages: StorePackage[] = [
  {
    id: 'starter',
    upAmount: 1000,
    priceLabel: 'R$ 10,00',
  },
  {
    id: 'boost',
    upAmount: 5000,
    priceLabel: 'R$ 45,00',
    badge: 'Mais popular',
  },
  {
    id: 'elite',
    upAmount: 10000,
    priceLabel: 'R$ 80,00',
  },
  {
    id: 'legend',
    upAmount: 25000,
    priceLabel: 'R$ 180,00',
  },
  {
    id: 'mythic',
    upAmount: 50000,
    priceLabel: 'R$ 320,00',
    badge: 'Melhor valor',
  },
  {
    id: 'cosmic',
    upAmount: 100000,
    priceLabel: 'R$ 600,00',
  },
]

export function formatUpAmount(amount: number) {
  return new Intl.NumberFormat('pt-BR').format(amount)
}
