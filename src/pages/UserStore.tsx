import { useEffect, useState, type MouseEvent } from 'react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { formatApAmount, formatCurrencyFromCents } from '../data/storePackages'
import StorePackageCard from '../features/user-panel/components/StorePackageCard'
import {
  createPendingOrder,
  listStorePackages,
  type CreateOrderResponse,
  type StorePackage,
} from '../features/store/services/storeApi'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'

type CreatedOrderDetails = {
  order: CreateOrderResponse
  storePackage: StorePackage
}

type PendingOrderModalProps = {
  details: CreatedOrderDetails
  onClose: () => void
}

function PendingOrderModal({ details, onClose }: PendingOrderModalProps) {
  const { order, storePackage } = details
  const apAmount = order.order.rewardAmount || storePackage.apAmount
  const amount = formatCurrencyFromCents(order.order.amountCents, order.order.currency)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="panel-modal-backdrop" onMouseDown={handleBackdropClick} role="presentation">
      <div
        aria-labelledby="pending-order-modal-title"
        aria-modal="true"
        className="panel-modal store-order-modal"
        role="dialog"
      >
        <button
          aria-label="Fechar confirmação do pedido"
          className="panel-modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="bx bx-x" aria-hidden="true" />
        </button>

        <p className="panel-card-kicker">Pedido criado</p>
        <h2 id="pending-order-modal-title">Aguardando pagamento</h2>
        <p>
          Pedido {order.order.orderNumber} criado com sucesso. O AP ainda não foi creditado.
        </p>

        <div className="store-order-summary" aria-label="Resumo do pedido pendente">
          <div>
            <span>Pacote</span>
            <strong>{order.order.packageName || storePackage.name}</strong>
          </div>
          <div>
            <span>AP</span>
            <strong>{formatApAmount(apAmount)} AP</strong>
          </div>
          <div>
            <span>Valor</span>
            <strong>{amount}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Aguardando pagamento</strong>
          </div>
        </div>

        <div className="store-order-warning">
          A integração de pagamento ainda não está ativa. Nenhum AP será creditado até essa etapa
          ficar disponível.
        </div>

        <div className="store-order-actions">
          <Button onClick={onClose} variant="primary">
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function UserStore() {
  const [packages, setPackages] = useState<StorePackage[]>([])
  const [createdOrderDetails, setCreatedOrderDetails] = useState<CreatedOrderDetails | null>(null)
  const [creatingPackageCode, setCreatingPackageCode] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  async function loadPackages() {
    setErrorMessage(undefined)
    setIsLoading(true)

    try {
      const nextPackages = await listStorePackages()
      setPackages(nextPackages)
    } catch {
      setErrorMessage('Não foi possível carregar os pacotes de AP. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  async function handleCreateOrder(storePackage: StorePackage) {
    setCreatedOrderDetails(null)
    setErrorMessage(undefined)
    setCreatingPackageCode(storePackage.code)

    try {
      const order = await createPendingOrder(storePackage.code)
      setCreatedOrderDetails({ order, storePackage })
    } catch {
      setErrorMessage('Não foi possível criar o pedido. Tente novamente.')
    } finally {
      setCreatingPackageCode(undefined)
    }
  }

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">Loja de AP</p>
          <h1>Pacotes para evoluir</h1>
          <p>
            Escolha um pacote de AP. O pedido é criado com segurança e fica pendente até a
            integração de pagamento ser ativada.
          </p>
        </section>

        {errorMessage && (
          <div className="mb-5">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}

        {isLoading ? (
          <div className="panel-state" role="status">
            Carregando pacotes...
          </div>
        ) : packages.length > 0 ? (
          <section className="store-grid" aria-label="Pacotes de AP">
            {packages.map((storePackage) => (
              <StorePackageCard
                isCreating={creatingPackageCode === storePackage.code}
                key={storePackage.code}
                onSelect={handleCreateOrder}
                storePackage={storePackage}
              />
            ))}
          </section>
        ) : (
          <div className="panel-state">
            Nenhum pacote disponível no momento.
          </div>
        )}

        {!isLoading && errorMessage && (
          <Button className="mt-5" onClick={loadPackages} variant="secondary">
            Tentar novamente
          </Button>
        )}

        {createdOrderDetails && (
          <PendingOrderModal
            details={createdOrderDetails}
            onClose={() => setCreatedOrderDetails(null)}
          />
        )}
      </main>
    </AuthenticatedLayout>
  )
}
