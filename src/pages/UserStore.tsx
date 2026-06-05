import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { formatApAmount, formatCurrencyFromCents } from '../data/storePackages'
import {
  createPendingOrder,
  getCurrentUserOrderStatus,
  listStorePackages,
  simulateApprovedPayment,
  type CreateOrderResponse,
  type StorePackage,
  type UserOrderSummary,
} from '../features/store/services/storeApi'
import StorePackageCard from '../features/user-panel/components/StorePackageCard'
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
  const [copyMessage, setCopyMessage] = useState<string>()
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false)
  const [simulationMessage, setSimulationMessage] = useState<string>()
  const [statusError, setStatusError] = useState<string>()
  const [statusOrder, setStatusOrder] = useState<UserOrderSummary>()
  const apAmount = order.order.rewardAmount || storePackage.apAmount
  const amount = formatCurrencyFromCents(order.order.amountCents, order.order.currency)
  const currentStatus = statusOrder?.status ?? order.order.status
  const isPaid = currentStatus === 'paid' || currentStatus === 'fulfilled'
  const statusLabel = isPaid ? 'Pago' : 'Aguardando pagamento Pix'
  const pixUnavailable = order.pix.unavailableReason && !order.pix.pixCopiaECola && !order.pix.qrCodeImage
  const canSimulateApprovedPayment = import.meta.env.DEV && !isPaid

  const pixDescription = useMemo(() => {
    if (isPaid) {
      return 'Pagamento confirmado. O saldo AP será atualizado pelo servidor.'
    }

    return 'O AP será creditado somente após confirmação real do pagamento Pix.'
  }, [isPaid])

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

  async function handleCopyPixCode() {
    if (!order.pix.pixCopiaECola) {
      return
    }

    await navigator.clipboard.writeText(order.pix.pixCopiaECola)
    setCopyMessage('Código Pix copiado.')
  }

  async function refreshOrderStatus() {
    const nextOrder = await getCurrentUserOrderStatus(order.order.orderNumber)
    setStatusOrder(nextOrder)

    return nextOrder
  }

  async function handleRefreshStatus() {
    setIsCheckingStatus(true)
    setStatusError(undefined)

    try {
      await refreshOrderStatus()
    } catch {
      setStatusError('Não foi possível atualizar o status agora.')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  async function handleSimulateApprovedPayment() {
    setIsSimulatingPayment(true)
    setSimulationMessage(undefined)
    setStatusError(undefined)

    try {
      const result = await simulateApprovedPayment(order.order.orderNumber)
      await refreshOrderStatus()
      window.dispatchEvent(
        new CustomEvent('site-universe:payment-updated', {
          detail: {
            orderNumber: order.order.orderNumber,
          },
        }),
      )
      setSimulationMessage(result.message)
    } catch {
      setStatusError('Nao foi possivel simular o pagamento agora.')
    } finally {
      setIsSimulatingPayment(false)
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
        <h2 id="pending-order-modal-title">{statusLabel}</h2>
        <p>Pedido {order.order.orderNumber} criado com sucesso.</p>

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
            <strong>{statusLabel}</strong>
          </div>
        </div>

        {order.pix.qrCodeImage && (
          <div className="store-pix-qr">
            <img alt="QR Code Pix do pedido" src={order.pix.qrCodeImage} />
          </div>
        )}

        {order.pix.pixCopiaECola && (
          <div className="store-pix-copy">
            <span>Pix copia e cola</span>
            <textarea readOnly value={order.pix.pixCopiaECola} />
          </div>
        )}

        <div className="store-order-warning">
          {pixUnavailable ? order.pix.unavailableReason : pixDescription}
        </div>

        {copyMessage && <div className="store-order-status-note">{copyMessage}</div>}
        {simulationMessage && <div className="store-order-status-note">{simulationMessage}</div>}
        {statusError && <div className="store-order-status-note store-order-status-error">{statusError}</div>}

        <div className="store-order-actions">
          {order.pix.pixCopiaECola && (
            <Button onClick={handleCopyPixCode} variant="secondary">
              <i className="bx bx-copy text-xl" aria-hidden="true" />
              Copiar código Pix
            </Button>
          )}
          <Button disabled={isCheckingStatus} onClick={handleRefreshStatus} variant="secondary">
            <i className="bx bx-refresh text-xl" aria-hidden="true" />
            {isCheckingStatus ? 'Atualizando...' : 'Já paguei / Atualizar status'}
          </Button>
          {canSimulateApprovedPayment && (
            <Button
              disabled={isSimulatingPayment}
              onClick={handleSimulateApprovedPayment}
              variant="secondary"
            >
              <i className="bx bx-check-circle text-xl" aria-hidden="true" />
              {isSimulatingPayment ? 'Simulando...' : 'Simular pagamento aprovado'}
            </Button>
          )}
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
      setErrorMessage('Não foi possível criar o pedido Pix. Tente novamente.')
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
            Escolha um pacote de AP. O pedido é criado com segurança e o pagamento é feito somente
            via Pix.
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
