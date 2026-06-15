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
  pix: {
    status: string | null
    pixCopiaECola: string | null
    qrCodeImage: string | null
    expiresAt: string | null
    unavailableReason: string | null
  }
}

export type UserOrderSummary = {
  id: string
  orderNumber: string
  packageCode: string
  packageName: string
  apAmount: number
  priceCents: number
  formattedPrice: string
  currency: string
  status: string
  createdAt: string
  paidAt: string | null
  paymentProvider: string | null
  paymentStatus: string | null
}

type ListOrdersResponse = {
  orders: UserOrderSummary[]
}

type OrderStatusResponse = {
  order: UserOrderSummary
}

type SimulateApprovedPaymentResponse = {
  ok: true
  orderStatus: 'paid'
  message: string
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
    csrf: true,
    headers: {
      'Idempotency-Key': createIdempotencyKey('order_create'),
    },
    method: 'POST',
  })
}

export async function listCurrentUserOrders() {
  const response = await apiRequest<ListOrdersResponse>('/orders')

  return response.orders
}

export async function getCurrentUserOrderStatus(orderNumber: string) {
  const response = await apiRequest<OrderStatusResponse>(
    `/orders/${encodeURIComponent(orderNumber)}/status`,
  )

  return response.order
}

export function simulateApprovedPayment(orderNumber: string) {
  return apiRequest<SimulateApprovedPaymentResponse>('/dev/payments/simulate-approved', {
    body: {
      orderNumber,
    },
    method: 'POST',
  })
}
