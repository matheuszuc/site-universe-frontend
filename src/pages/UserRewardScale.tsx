import { useEffect, useMemo, useState } from 'react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import CycleProgress from '../features/user-panel/components/CycleProgress'
import RewardTierCard from '../features/user-panel/components/RewardTierCard'
import RewardTierDetailsModal from '../features/user-panel/components/RewardTierDetailsModal'
import {
  claimRewardTier,
  getRewardScale,
  type RewardScale,
} from '../features/rewards/services/rewardsApi'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { useTranslation } from '../i18n'
import type { RewardTier } from '../data/rewardTiers'

export default function UserRewardScale() {
  const { t } = useTranslation()
  const [claimingTierCode, setClaimingTierCode] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState<RewardScale>()
  const [selectedTierCode, setSelectedTierCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const selectedTier = useMemo(
    () => scale?.tiers.find((tier) => tier.code === selectedTierCode) ?? null,
    [scale?.tiers, selectedTierCode],
  )
  const currentAp = scale?.currentCycle.accumulatedAp ?? 0
  const maxAp = scale?.tiers.at(-1)?.requiredUpTotal ?? 1
  const nextRankName = scale?.nextRank?.name ?? scale?.tiers.at(-1)?.name ?? 'Rank final'
  const missingAp = scale?.nextRank?.missingAp ?? 0

  async function loadScale() {
    setErrorMessage(undefined)
    setIsLoading(true)

    try {
      const nextScale = await getRewardScale()
      setScale(nextScale)
    } catch {
      setErrorMessage(t.rewards.loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScale()
  }, [])

  useEffect(() => {
    function refreshScaleAfterPayment() {
      void loadScale()
    }

    window.addEventListener('site-universe:payment-updated', refreshScaleAfterPayment)

    return () => {
      window.removeEventListener('site-universe:payment-updated', refreshScaleAfterPayment)
    }
  }, [])

  async function handleClaim(tier: RewardTier) {
    setErrorMessage(undefined)
    setSuccessMessage(undefined)
    setClaimingTierCode(tier.code)

    try {
      await claimRewardTier(tier.code)
      await loadScale()
      setSuccessMessage(t.rewards.claimSuccess)
    } catch {
      setErrorMessage(t.rewards.claimError)
    } finally {
      setClaimingTierCode(undefined)
    }
  }

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{t.rewards.scaleKicker}</p>
          <h1>{t.rewards.scaleTitle}</h1>
          <p>{t.rewards.scaleDescription}</p>
          <p className="reward-youtube-note">
            {t.rewards.youtubeNote}{' '}
            <a
              href="https://youtube.com/@life_gx?si=uPc3KTTt9uHIXSzM"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t.rewards.youtubeLinkLabel}
            </a>
            .
          </p>
        </section>

        {errorMessage && (
          <div className="mb-5">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}

        {successMessage && (
          <div className="mb-5">
            <Alert tone="success">{successMessage}</Alert>
          </div>
        )}

        {isLoading ? (
          <div className="panel-state" role="status">
            {t.rewards.loading}
          </div>
        ) : scale ? (
          <>
            <CycleProgress
              currentUp={currentAp}
              maxUp={maxAp}
              missingUp={missingAp}
              nextRankName={nextRankName}
            />

            <section className="reward-grid mt-5" aria-label={t.rewards.scaleGridLabel}>
              {scale.tiers.map((tier) => (
                <RewardTierCard
                  isClaiming={claimingTierCode === tier.code}
                  key={tier.code}
                  onClaim={handleClaim}
                  onOpen={(nextTier) => setSelectedTierCode(nextTier.code)}
                  tier={tier}
                />
              ))}
            </section>

            <div className="mt-5 rounded-lg border border-white/15 bg-white/[0.08] p-4 text-sm leading-relaxed text-white/65">
              {t.rewards.scaleCycleNote}
            </div>
          </>
        ) : (
          <div className="panel-state">{t.rewards.noScaleData}</div>
        )}

        {!isLoading && errorMessage && (
          <Button className="mt-5" onClick={loadScale} variant="secondary">
            {t.rewards.retryButton}
          </Button>
        )}

        {selectedTier && (
          <RewardTierDetailsModal
            currentUp={currentAp}
            isClaiming={claimingTierCode === selectedTier.code}
            onClaim={handleClaim}
            onClose={() => setSelectedTierCode(undefined)}
            tier={selectedTier}
          />
        )}
      </main>
    </AuthenticatedLayout>
  )
}
