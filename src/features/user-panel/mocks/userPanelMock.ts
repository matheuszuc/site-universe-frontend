import type { UserPanelData } from '../types/userPanelTypes'

// Dados mockados apenas para montar e validar o layout do painel.
// O frontend não decide saldo real, não credita recompensa e não confirma pagamento.
export const userPanelMock: UserPanelData = {
  user: {
    id: 'mock-user',
    name: 'AventureiroUniverse',
    email: 'jogador@exemplo.com',
    role: 'user',
    status: 'pending_verification',
    accountStatus: 'pending_verification',
    emailVerified: false,
  },
  balance: {
    upAmount: 1250,
    updatedAt: '2026-06-01T18:30:00.000Z',
  },
  activities: [
    {
      id: 'activity-001',
      type: 'account',
      title: 'Conta criada',
      description: 'Cadastro inicial registrado no frontend público.',
      occurredAt: '2026-05-28T12:20:00.000Z',
    },
    {
      id: 'activity-002',
      type: 'transactions',
      title: 'Histórico de transações em breve',
      description:
        'Futuramente, compras, recompensas e movimentações de UP aparecerão aqui após validação do backend.',
      occurredAt: '2026-05-28T12:24:00.000Z',
    },
  ],
}
