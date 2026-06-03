import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { formatUpAmount, type StorePackage } from '../../../data/storePackages'

type StorePackageCardProps = {
  storePackage: StorePackage
  onSelect: (storePackage: StorePackage) => void
}

export default function StorePackageCard({ storePackage, onSelect }: StorePackageCardProps) {
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

      <p className="panel-card-kicker">Pacote de UP</p>
      <h2 className="mt-3 text-3xl font-black text-white">
        {formatUpAmount(storePackage.upAmount)} UP
      </h2>
      <p className="mt-2 text-lg font-black text-cyan-100">{storePackage.priceLabel}</p>

      <p className="mt-4 min-h-12 text-sm leading-relaxed text-white/65">
        Pacote visual para a loja do painel. A compra real será ativada em uma etapa futura.
      </p>

      <Button className="mt-5 w-full" onClick={() => onSelect(storePackage)} variant="secondary">
        <i className="bx bx-cart-add text-xl" aria-hidden="true" />
        Comprar
      </Button>
    </Card>
  )
}
