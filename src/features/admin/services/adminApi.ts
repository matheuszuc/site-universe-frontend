import { apiRequest } from '../../../services/api'
import type {
  AdminAuditLogsResponse,
  AdminChampionsResponse,
  AdminGameDeliveriesResponse,
  AdminMeResponse,
  AdminOrdersResponse,
  AdminUsersResponse,
} from '../types/adminTypes'

export const adminApi = {
  me() {
    return apiRequest<AdminMeResponse>('/admin/me')
  },
  getUsers() {
    return apiRequest<AdminUsersResponse>('/admin/users')
  },
  getOrders() {
    return apiRequest<AdminOrdersResponse>('/admin/orders')
  },
  getGameDeliveries() {
    return apiRequest<AdminGameDeliveriesResponse>('/admin/game-deliveries')
  },
  getAuditLogs() {
    return apiRequest<AdminAuditLogsResponse>('/admin/audit-logs')
  },
  getChampions(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (typeof month === 'number') params.set('month', String(month))
    if (typeof year === 'number') params.set('year', String(year))
    const query = params.toString()
    return apiRequest<AdminChampionsResponse>(
      `/api/admin/ranking/champions${query ? `?${query}` : ''}`,
    )
  },
}
