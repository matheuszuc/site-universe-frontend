import { useState } from 'react'
import CycleProgress from '../features/user-panel/components/CycleProgress'
import RewardTierCard from '../features/user-panel/components/RewardTierCard'
import RewardTierDetailsModal from '../features/user-panel/components/RewardTierDetailsModal'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { currentCycleUp, rewardTiers, type RewardTier } from '../data/rewardTiers'

function getNextTier() {
  return (
    rewardTiers.find((tier) => tier.requiredUpTotal > currentCycleUp) ??
    rewardTiers[rewardTiers.length - 1]
  )
}

export default function UserRewardScale() {
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null)
  const maxUp = rewardTiers[rewardTiers.length - 1].requiredUpTotal
  const nextTier = getNextTier()
  const missingUp = Math.max(0, nextTier.requiredUpTotal - currentCycleUp)

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">Escala de recompensas</p>
          <h1>Progresso do ciclo</h1>
          <p>
            A escala usa o UP acumulado no ciclo atual do site. O UP dentro do jogo não interfere
            neste progresso visual.
          </p>
        </section>

        <CycleProgress
          currentUp={currentCycleUp}
          maxUp={maxUp}
          missingUp={missingUp}
          nextRankName={nextTier.name}
        />

        <section className="reward-grid mt-5" aria-label="Ranks da escala de recompensas">
          {rewardTiers.map((tier) => (
            <RewardTierCard key={tier.code} onOpen={setSelectedTier} tier={tier} />
          ))}
        </section>

        <div className="mt-5 rounded-lg border border-white/15 bg-white/[0.08] p-4 text-sm leading-relaxed text-white/65">
          Quando o Rank 6 for concluído futuramente, um novo ciclo começará do zero. O resgate real
          ainda não está ativo nesta tela.
        </div>

        {selectedTier && (
          <RewardTierDetailsModal
            currentUp={currentCycleUp}
            onClose={() => setSelectedTier(null)}
            tier={selectedTier}
          />
        )}
      </main>
    </AuthenticatedLayout>
  )
}
