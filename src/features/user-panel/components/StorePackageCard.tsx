import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { useTranslation } from '../../../i18n'
import { formatApAmount } from '../../../data/storePackages'
import type { StorePackage } from '../../store/services/storeApi'

type StorePackageCardProps = {
  disabled?: boolean
  isCreating?: boolean
  storePackage: StorePackage
  onSelect: (storePackage: StorePackage) => void
}

export default function StorePackageCard({
  disabled = false,
  isCreating = false,
  storePackage,
  onSelect,
}: StorePackageCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="relative overflow-hidden p-5">
      {storePackage.badge && (
        <span className="store-package-badge">{storePackage.badge}</span>
      )}

      <div className="store-coin-stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <p className="panel-card-kicker">{t.store.kicker}</p>
      <h2 className="mt-3 text-3xl font-black text-white">
        {formatApAmount(storePackage.apAmount)} Unicoin
      </h2>
      <p className="mt-2 text-lg font-black text-cyan-100">{storePackage.formattedPrice}</p>

      <Button
        className="mt-5 w-full"
        disabled={isCreating || disabled}
        onClick={() => onSelect(storePackage)}
        variant="secondary"
      >
        <i className="bx bx-cart-add text-xl" aria-hidden="true" />
        {isCreating ? t.store.buying : t.store.buy}
      </Button>
    </Card>
  )
}
