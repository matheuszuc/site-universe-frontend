import { userPanelMock } from '../mocks/userPanelMock'
import type { UserPanelData } from '../types/userPanelTypes'

export async function getUserPanelData(): Promise<UserPanelData> {
  // Futuramente este service será substituído por uma chamada de API autenticada.
  // Backend será responsável por autenticação, autorização, saldo, pagamentos e recompensas.
  return Promise.resolve(userPanelMock)
}
