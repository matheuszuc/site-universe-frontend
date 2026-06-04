import { apiRequest } from '../../../services/api'
import { formatCurrencyFromCents } from '../../../data/storePackages'

type StorePackageMetadata = {
  publicBadge?: string | null
}

type BackendStorePackage = {
  code: string
  name: string
  upAmount: number
  priceCents: number
  currency: string
  displayOrder: number
  metadata?: StorePackageMetadata | null
}

type StorePackagesResponse = {
  packages: BackendStorePackage[]
}

export type StorePackage = {
  code: string
  name: string
  apAmount: number
  priceCents: number
  currency: string
  displayOrder: number
  formattedPrice: string
  badge?: string
}

export type CreateOrderResponse = {
  order: {
    id: string
    orderNumber: string
    status: string
    packageCode: string
    packageName: string
    amountCents: number
    currency: string
    rewardType: string
    rewardAmount: number
    expiresAt: string | null
    createdAt: string
  }
  payment: {
    id: string
    status: string
    provider: string
    amountCents: number
    currency: string
    createdAt: string
  }
}

function createIdempotencyKey(prefix: string) {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}:${randomId}`
}

function normalizeStorePackage(storePackage: BackendStorePackage): StorePackage {
  return {
    code: storePackage.code,
    name: storePackage.name,
    apAmount: storePackage.upAmount,
    priceCents: storePackage.priceCents,
    currency: storePackage.currency,
    displayOrder: storePackage.displayOrder,
    formattedPrice: formatCurrencyFromCents(storePackage.priceCents, storePackage.currency),
    badge: storePackage.metadata?.publicBadge ?? undefined,
  }
}

export async function listStorePackages() {
  const response = await apiRequest<StorePackagesResponse>('/api/store/packages')

  return response.packages.map(normalizeStorePackage)
}

export function createPendingOrder(packageCode: string) {
  return apiRequest<CreateOrderResponse>('/orders', {
    body: {
      packageCode,
    },
    headers: {
      'Idempotency-Key': createIdempotencyKey('order_create'),
    },
    method: 'POST',
  })
}
