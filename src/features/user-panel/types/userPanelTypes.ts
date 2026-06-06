export type AccountStatus = 'active' | 'pending_verification' | 'restricted'

export type DashboardActivityType =
  | 'ACCOUNT_CREATED'
  | 'EMAIL_VERIFIED'
  | 'PASSWORD_RESET_SUCCESS'

export type UserActivity = {
  type: DashboardActivityType
  label: string
  createdAt: string
}

export type ApBalanceSummary = {
  availableAp: number
  cycleAccumulatedAp: number
  currentCycleNumber: number | null
  paidOrdersCount: number
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

export type UserPanelData = {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    accountStatus: AccountStatus
    emailVerified: boolean
    emailVerifiedAt: string | null
    createdAt: string
    lastLoginAt: string | null
  }
  account: {
    createdAt: string
    statusLabel: string
    emailStatusLabel: string
  }
  features: {
    shopEnabled: boolean
    rewardsEnabled: boolean
    gameIntegrationEnabled: boolean
    paymentsEnabled: boolean
  }
  balances: ApBalanceSummary
  activities: UserActivity[]
  orders: UserOrderSummary[]
}

export type UserDashboardResponse = {
  user: Omit<UserPanelData['user'], 'accountStatus'>
  account: UserPanelData['account']
  features: UserPanelData['features']
  balances: ApBalanceSummary
  activity: UserActivity[]
}
