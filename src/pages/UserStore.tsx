import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
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
import { authApi } from '../features/auth/services/authApi'
import StorePackageCard from '../features/user-panel/components/StorePackageCard'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

type CreatedOrderDetails = {
  order: CreateOrderResponse
  storePackage: StorePackage
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

type CpfModalProps = {
  storePackage: StorePackage
  isCreating: boolean
  onConfirm: (cpf: string) => void
  onClose: () => void
}

// Pede o CPF antes de gerar o Pix: o Asaas exige cpfCnpj para criar o customer.
// O valor nao e armazenado no banco (pendencia futura de LGPD).
function CpfModal({ storePackage, isCreating, onConfirm, onClose }: CpfModalProps) {
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState<string>()

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const digits = onlyDigits(cpf)

    if (digits.length !== 11) {
      setCpfError('Digite um CPF válido com 11 dígitos (somente números).')
      return
    }

    setCpfError(undefined)
    onConfirm(digits)
  }

  return (
    <div className="panel-modal-backdrop" onMouseDown={handleBackdropClick} role="presentation">
      <div
        aria-labelledby="cpf-modal-title"
        aria-modal="true"
        className="panel-modal store-order-modal"
        role="dialog"
      >
        <button
          aria-label="Fechar"
          className="panel-modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="bx bx-x" aria-hidden="true" />
        </button>

        <p className="panel-card-kicker">{storePackage.name}</p>
        <h2 id="cpf-modal-title">Informe seu CPF</h2>
        <p>Digite seu CPF (somente números) para gerar o pagamento via Pix.</p>

        <form onSubmit={handleSubmit}>
          <div className="store-pix-copy">
            <label htmlFor="cpf-input">CPF</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-white/20 bg-white px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              id="cpf-input"
              inputMode="numeric"
              maxLength={14}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="Somente números"
              style={{ color: '#0f172a' }}
              type="text"
              value={cpf}
            />
          </div>

          {cpfError && (
            <div className="store-order-status-note store-order-status-error">{cpfError}</div>
          )}

          <div className="store-order-actions">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isCreating} type="submit" variant="primary">
              {isCreating ? 'Gerando Pix...' : 'Continuar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

type PendingOrderModalProps = {
  details: CreatedOrderDetails
  onClose: () => void
}

function PendingOrderModal({ details, onClose }: PendingOrderModalProps) {
  const { t } = useTranslation()
  const { order, storePackage } = details
  const [copyMessage, setCopyMessage] = useState<string>()
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false)
  const [simulationMessage, setSimulationMessage] = useState<string>()
  const [statusError, setStatusError] = useState<string>()
  const [statusOrder, setStatusOrder] = useState<UserOrderSummary>()
  const apAmount = order.order.rewardAmount || storePackage.apAmount
  const amount = formatCurrencyFromCents(order.order.amountCents, order.order.currency)
  const currentStatus = statusOrder?.status ?? order.order.status
  const isPaid = currentStatus === 'paid' || currentStatus === 'fulfilled'
  const statusLabel = isPaid ? t.store.orderPaid : t.store.orderWaiting
  const pixUnavailable = order.pix.unavailableReason && !order.pix.pixCopiaECola && !order.pix.qrCodeImage
  const canSimulateApprovedPayment = import.meta.env.DEV && !isPaid

  const pixDescription = useMemo(() => {
    if (isPaid) {
      return t.store.paidDescription
    }
    return t.store.pixWaiting
  }, [isPaid, t.store.paidDescription, t.store.pixWaiting])

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
    setCopyMessage(t.store.pixCopied)
  }

  async function refreshOrderStatus() {
    const nextOrder = await getCurrentUserOrderStatus(order.order.orderNumber)
    setStatusOrder(nextOrder)

    return nextOrder
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
      setStatusError(t.store.simulateError)
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
          aria-label={t.store.closeOrder}
          className="panel-modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="bx bx-x" aria-hidden="true" />
        </button>

        <p className="panel-card-kicker">{t.store.orderCreated}</p>
        <h2 id="pending-order-modal-title">{statusLabel}</h2>
        <p>{t.store.orderCreated} {order.order.orderNumber} {t.store.orderCreatedNote}</p>

        <div className="store-order-summary" aria-label={t.store.orderSummaryLabel}>
          <div>
            <span>{t.store.packageLabel}</span>
            <strong>{order.order.packageName || storePackage.name}</strong>
          </div>
          <div>
            <span>{t.store.unicoinLabel}</span>
            <strong>{formatApAmount(apAmount)} Unicoin</strong>
          </div>
          <div>
            <span>{t.store.valueLabel}</span>
            <strong>{amount}</strong>
          </div>
          <div>
            <span>{t.store.statusLabel}</span>
            <strong>{statusLabel}</strong>
          </div>
        </div>

        {order.pix.qrCodeImage && (
          <div className="store-pix-qr">
            <img alt={t.store.pixQrAlt} src={order.pix.qrCodeImage} />
          </div>
        )}

        {order.pix.pixCopiaECola && (
          <div className="store-pix-copy">
            <span>{t.store.pixCopiaECola}</span>
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
              {t.store.copyPix}
            </Button>
          )}
          {canSimulateApprovedPayment && (
            <Button
              disabled={isSimulatingPayment}
              onClick={handleSimulateApprovedPayment}
              variant="secondary"
            >
              <i className="bx bx-check-circle text-xl" aria-hidden="true" />
              {isSimulatingPayment ? t.store.simulating : t.store.simulatePayment}
            </Button>
          )}
          <Button onClick={onClose} variant="primary">
            {t.store.confirm}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function UserStore() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [packages, setPackages] = useState<StorePackage[]>([])
  const [createdOrderDetails, setCreatedOrderDetails] = useState<CreatedOrderDetails | null>(null)
  const [cpfPackage, setCpfPackage] = useState<StorePackage | null>(null)
  const [creatingPackageCode, setCreatingPackageCode] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [resendMessage, setResendMessage] = useState<string>()

  const emailNotVerified = user !== null && user.emailVerified === false

  async function loadPackages() {
    setErrorMessage(undefined)
    setIsLoading(true)

    try {
      const nextPackages = await listStorePackages()
      setPackages(nextPackages)
    } catch {
      setErrorMessage(t.store.loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  async function handleResendVerification() {
    if (!user?.email) return
    setIsResendingVerification(true)
    setResendMessage(undefined)

    try {
      const result = await authApi.resendVerification(user.email)
      setResendMessage(result.message)
    } catch (error) {
      if (error instanceof ApiError) {
        setResendMessage(getApiErrorMessage(error))
      }
    } finally {
      setIsResendingVerification(false)
    }
  }

  // Abre o modal de CPF antes de criar o pedido (o Asaas exige cpfCnpj no Pix).
  function handleSelectPackage(storePackage: StorePackage) {
    if (emailNotVerified) return

    setErrorMessage(undefined)
    setCpfPackage(storePackage)
  }

  async function handleCreateOrder(storePackage: StorePackage, cpfCnpj: string) {
    if (emailNotVerified) return

    setCreatedOrderDetails(null)
    setErrorMessage(undefined)
    setCreatingPackageCode(storePackage.code)

    try {
      const order = await createPendingOrder(storePackage.code, cpfCnpj)
      setCpfPackage(null)
      setCreatedOrderDetails({ order, storePackage })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setErrorMessage(t.store.emailNotVerified)
        setCpfPackage(null)
      } else {
        setErrorMessage(t.store.createError)
      }
    } finally {
      setCreatingPackageCode(undefined)
    }
  }

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{t.store.kicker}</p>
          <h1>{t.store.title}</h1>
          <p>{t.store.subtitle}</p>
        </section>

        {emailNotVerified && (
          <div className="mb-5">
            <Alert tone="error">
              <span>{t.store.emailNotVerified}</span>
              {' '}
              <button
                className="underline font-semibold hover:opacity-80 ml-2"
                disabled={isResendingVerification}
                onClick={handleResendVerification}
                type="button"
              >
                {isResendingVerification ? '...' : t.store.resendVerification}
              </button>
            </Alert>
            {resendMessage && (
              <div className="mt-2">
                <Alert tone="success">{resendMessage}</Alert>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}

        {isLoading ? (
          <div className="panel-state" role="status">
            {t.store.loading}
          </div>
        ) : packages.length > 0 ? (
          <section className="store-grid" aria-label={t.store.kicker}>
            {packages.map((storePackage) => (
              <StorePackageCard
                disabled={emailNotVerified}
                isCreating={creatingPackageCode === storePackage.code}
                key={storePackage.code}
                onSelect={handleSelectPackage}
                storePackage={storePackage}
              />
            ))}
          </section>
        ) : (
          <div className="panel-state">
            {t.store.noPackages}
          </div>
        )}

        {!isLoading && errorMessage && (
          <Button className="mt-5" onClick={loadPackages} variant="secondary">
            {t.store.retry}
          </Button>
        )}

        {cpfPackage && (
          <CpfModal
            isCreating={creatingPackageCode === cpfPackage.code}
            onClose={() => setCpfPackage(null)}
            onConfirm={(cpf) => handleCreateOrder(cpfPackage, cpf)}
            storePackage={cpfPackage}
          />
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
