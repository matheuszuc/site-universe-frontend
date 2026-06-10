import { apiRequest } from '../../../services/api'
import type {
  AdminAuditLogsResponse,
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
}
