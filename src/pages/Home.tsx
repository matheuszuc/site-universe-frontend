import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import { useAuth } from '../contexts/AuthContext'
import { gameClasses } from '../data/classes'
import { clientDownloadUrl } from '../data/siteLinks'

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [active, setActive] = useState(0)
  const total = gameClasses.length

  function updateSlide(direction: number) {
    setActive((current) => {
      const next = current + direction
      if (next >= total) return 0
      if (next < 0) return total - 1
      return next
    })
  }

  useEffect(() => {
    const timer = window.setInterval(() => updateSlide(1), 5000)
    return () => window.clearInterval(timer)
  }, [])

  const currentClass = gameClasses[active]

  return (
    <PublicLayout variant="home">
      <main className="home-container">
        <div className="tech-circle" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="circle" key={index} />
          ))}
        </div>

        <section className="list" aria-label="Classes do jogo">
          {gameClasses.map((gameClass, index) => (
            <article className={`item ${index === active ? 'active' : ''}`} key={gameClass.name}>
              <div className="product-img">
                <img src={gameClass.image} alt={gameClass.alt} />
              </div>

              <div className="content">
                <p className="product-tag">Classe em destaque</p>
                <h1>{gameClass.name}</h1>
                <p className="description">{gameClass.description}</p>
                <div className="home-actions">
                  {!isLoading && isAuthenticated ? (
                    <Link className="home-action-button primary" to="/painel">
                      {user?.name ? `Painel de ${user.name}` : 'Ir para o painel'}
                    </Link>
                  ) : (
                    <>
                      <Link className="home-action-button primary" to="/register">
                        Criar conta
                      </Link>
                      <Link className="home-action-button secondary" to="/login">
                        Entrar
                      </Link>
                    </>
                  )}
                  <a
                    className="home-action-button secondary"
                    href={clientDownloadUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Download
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="arrows">
          <button className="arrow-btn" type="button" aria-label="Classe anterior" onClick={() => updateSlide(-1)}>
            <i className="bx bx-left-arrow-alt" />
          </button>

          <button className="arrow-btn" type="button" aria-label="Próxima classe" onClick={() => updateSlide(1)}>
            <i className="bx bx-right-arrow-alt" />
          </button>
        </div>

        <div className="indicators">
          <div className="numbers">{String(active + 1).padStart(2, '0')}</div>
          <p className="current-class">{currentClass.name}</p>
          <div className="dots" aria-label="Selecionar classe">
            {gameClasses.map((gameClass, index) => (
              <button
                key={gameClass.name}
                className={`dot ${index === active ? 'active' : ''}`}
                type="button"
                aria-label={`Ir para ${gameClass.name}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}
