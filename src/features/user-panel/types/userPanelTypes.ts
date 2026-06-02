export type AccountStatus = 'active' | 'pending_verification' | 'restricted'

export type ActivityType = 'account' | 'transactions'

export type UserActivity = {
  id: string
  type: ActivityType
  title: string
  description: string
  occurredAt: string
}

export type UserPanelData = {
  user: {
    username: string
    email: string
    accountStatus: AccountStatus
    emailVerified: boolean
  }
  balance: {
    upAmount: number
    updatedAt: string
  }
  activities: UserActivity[]
}
