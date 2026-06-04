import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { formatApAmount } from '../../../data/storePackages'
import type { StorePackage } from '../../store/services/storeApi'

type StorePackageCardProps = {
  isCreating?: boolean
  storePackage: StorePackage
  onSelect: (storePackage: StorePackage) => void
}

export default function StorePackageCard({
  isCreating = false,
  storePackage,
  onSelect,
}: StorePackageCardProps) {
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

      <p className="panel-card-kicker">Pacote de AP</p>
      <h2 className="mt-3 text-3xl font-black text-white">
        {formatApAmount(storePackage.apAmount)} AP
      </h2>
      <p className="mt-2 text-lg font-black text-cyan-100">{storePackage.formattedPrice}</p>

      <p className="mt-4 min-h-12 text-sm leading-relaxed text-white/65">
        Pacote disponível no catálogo do Site Universe. O pedido será criado com status pendente.
      </p>

      <Button
        className="mt-5 w-full"
        disabled={isCreating}
        onClick={() => onSelect(storePackage)}
        variant="secondary"
      >
        <i className="bx bx-cart-add text-xl" aria-hidden="true" />
        {isCreating ? 'Criando pedido...' : 'Comprar AP'}
      </Button>
    </Card>
  )
}
