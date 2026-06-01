import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { gameClasses } from '../data/classes.js'

export default function Home() {
  const [active, setActive] = useState(0)
  const total = gameClasses.length

  function updateSlide(direction) {
    setActive((current) => {
      const next = current + direction
      if (next >= total) return 0
      if (next < 0) return total - 1
      return next
    })
  }

  useEffect(() => {
    const timer = setInterval(() => updateSlide(1), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="home-page">
      <Header />

      <main className="home-container">
        <div className="tech-circle" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="circle" key={index}></div>
          ))}
        </div>

        <section className="list" aria-label="Classes do jogo">
          {gameClasses.map((gameClass, index) => (
            <article className={`item ${index === active ? 'active' : ''}`} key={gameClass.name}>
              <div className="product-img">
                <img src={gameClass.image} alt={gameClass.alt} />
              </div>

              <div className="content">
                <p className="product-tag">{gameClass.name}</p>
                <p className="description">{gameClass.description}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="arrows">
          <button className="arrow-btn" type="button" aria-label="Classe anterior" onClick={() => updateSlide(-1)}>
            <i className="bx bx-left-arrow-alt"></i>
          </button>

          <button className="arrow-btn" type="button" aria-label="Próxima classe" onClick={() => updateSlide(1)}>
            <i className="bx bx-right-arrow-alt"></i>
          </button>
        </div>

        <div className="indicators">
          <div className="numbers">{String(active + 1).padStart(2, '0')}</div>
          <div className="dots" aria-label="Selecionar classe">
            {gameClasses.map((gameClass, index) => (
              <button
                key={gameClass.name}
                className={`dot ${index === active ? 'active' : ''}`}
                type="button"
                aria-label={`Ir para ${gameClass.name}`}
                onClick={() => setActive(index)}
              ></button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
