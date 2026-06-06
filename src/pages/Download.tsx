import PublicLayout from '../components/layout/PublicLayout'
import { clientDownloadUrl, supportDiscordUrl } from '../data/siteLinks'

const downloadSteps = [
  'Baixe o cliente do servidor pelo Google Drive oficial.',
  'Após baixar, extraia os arquivos em uma pasta de sua preferência.',
  'Execute o launcher/cliente conforme instruções do servidor.',
]

export default function Download() {
  return (
    <PublicLayout>
      <main className="download-page">
        <section className="download-hero">
          <p className="legal-kicker">Cliente do servidor</p>
          <h1>Download</h1>
          <p>
            Baixe o cliente do Site Universe pelo link oficial. O arquivo fica hospedado no
            Google Drive e não é armazenado neste repositório.
          </p>

          <div className="download-actions">
            <a
              className="home-action-button primary"
              href={clientDownloadUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Baixar pelo Google Drive
            </a>
            <a
              className="home-action-button secondary"
              href={supportDiscordUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Suporte no Discord
            </a>
          </div>
        </section>

        <section className="download-steps" aria-label="Instruções de instalação">
          {downloadSteps.map((step, index) => (
            <article className="download-step" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </article>
          ))}
        </section>
      </main>
    </PublicLayout>
  )
}
