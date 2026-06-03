import { useState } from 'react'
import StorePackageCard from '../features/user-panel/components/StorePackageCard'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { formatUpAmount, storePackages, type StorePackage } from '../data/storePackages'

export default function UserStore() {
  const [selectedPackage, setSelectedPackage] = useState<StorePackage | null>(null)

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">Loja de UP</p>
          <h1>Pacotes para evoluir</h1>
          <p>
            Escolha visualmente um pacote de UP. Nesta etapa, os cards são apenas informativos e
            nenhuma compra é iniciada pelo painel.
          </p>
        </section>

        <section className="store-grid" aria-label="Pacotes de UP">
          {storePackages.map((storePackage) => (
            <StorePackageCard
              key={storePackage.id}
              onSelect={setSelectedPackage}
              storePackage={storePackage}
            />
          ))}
        </section>

        {selectedPackage && (
          <div className="panel-modal-backdrop" role="presentation">
            <div
              aria-labelledby="store-modal-title"
              aria-modal="true"
              className="panel-modal"
              role="dialog"
            >
              <button
                aria-label="Fechar aviso"
                className="panel-modal-close"
                onClick={() => setSelectedPackage(null)}
                type="button"
              >
                <i className="bx bx-x" aria-hidden="true" />
              </button>

              <p className="panel-card-kicker">Pagamento em breve</p>
              <h2 id="store-modal-title">
                {formatUpAmount(selectedPackage.upAmount)} UP por {selectedPackage.priceLabel}
              </h2>
              <p>
                A compra real será liberada depois, com confirmação segura pelo servidor. Por
                enquanto, este botão não cria pedido e não envia dados de pagamento.
              </p>
              <button
                className="panel-topbar-link mt-5"
                onClick={() => setSelectedPackage(null)}
                type="button"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </main>
    </AuthenticatedLayout>
  )
}
