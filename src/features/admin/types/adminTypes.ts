export type AdminMeResponse = {
  ok: true
  role: 'ADMIN'
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  status: string
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

export type AdminUsersResponse = {
  users: AdminUser[]
}

export type AdminOrder = {
  id: string
  orderNumber: string
  userName: string
  userEmail: string
  packageName: string
  packageCode: string
  amountCents: number
  currency: string
  rewardAmount: number
  status: string
  createdAt: string
  paidAt: string | null
}

export type AdminOrdersResponse = {
  orders: AdminOrder[]
}

export type AdminGameDelivery = {
  id: string
  userName: string
  userEmail: string
  type: string
  status: string
  rewardTierCode: string | null
  attempts: number
  lastError: string | null
  createdAt: string
  deliveredAt: string | null
}

export type AdminGameDeliveriesResponse = {
  deliveries: AdminGameDelivery[]
}

export type AdminAuditLog = {
  id: string
  eventType: string
  entityType: string
  actorType: string
  actorId: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  orderId: string | null
  success: boolean
  reason: string | null
  createdAt: string
}

export type AdminAuditLogsResponse = {
  logs: AdminAuditLog[]
}
