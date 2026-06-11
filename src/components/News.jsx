import { useEffect, useState } from 'react'
import { getNews } from '../api.js'

// "hace 35 min", "hace 3 h", "hace 2 días"
function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

export default function News() {
  const [articles, setArticles] = useState(undefined)

  useEffect(() => {
    getNews().then(setArticles).catch(() => setArticles(null))
  }, [])

  if (articles === undefined) {
    return <p className="muted center lineup-msg">Cargando noticias…</p>
  }

  if (articles === null || articles.length === 0) {
    return (
      <div className="card center-card">
        <h3>Sin noticias por ahora</h3>
        <p className="muted">No pudimos cargar las noticias. Intenta de nuevo en unos minutos.</p>
      </div>
    )
  }

  return (
    <section>
      <p className="hint">Cobertura del Mundial por ESPN Deportes. Toca una nota para leerla completa.</p>
      <div className="news-grid">
        {articles.map((a) => (
          <a
            key={a.link || a.headline}
            className="news-card"
            href={a.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {a.image && <img src={a.image} alt="" className="news-img" loading="lazy" />}
            <div className="news-body">
              <span className="news-time">{timeAgo(a.published)}</span>
              <h3 className="news-headline">{a.headline}</h3>
              {a.description && <p className="news-desc">{a.description}</p>}
              <span className="news-source">Leer en ESPN →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
