import { apiRequest } from '../../../services/api'
import type {
  AccountStatus,
  UserDashboardResponse,
  UserPanelData,
} from '../types/userPanelTypes'

function getAccountStatus(user: UserDashboardResponse['user']): AccountStatus {
  if (!user.emailVerified || user.status === 'pending_verification') {
    return 'pending_verification'
  }

  if (user.status !== 'active') {
    return 'restricted'
  }

  return 'active'
}

export async function getUserPanelData(): Promise<UserPanelData> {
  const response = await apiRequest<UserDashboardResponse>('/users/me/dashboard')

  return {
    user: {
      ...response.user,
      accountStatus: getAccountStatus(response.user),
    },
    account: response.account,
    features: response.features,
    activities: response.activity,
  }
}
