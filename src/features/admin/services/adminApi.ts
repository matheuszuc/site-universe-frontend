import { apiRequest } from '../../../services/api'
import type { AdminMeResponse } from '../types/adminTypes'

export const adminApi = {
  me() {
    return apiRequest<AdminMeResponse>('/admin/me')
  },
}
