import { useEffect, useState } from 'react'
import { getNews, getArticle } from '../api.js'

// "hace 35 min", "hace 3 h", "hace 2 días"
function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

// El HTML viene de la API de ESPN: quitamos scripts, atributos de evento y
// los placeholders de medios (<video1>, <photo1>...), y absolutizamos enlaces.
function cleanStory(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?(<\/iframe>|\/>)/gi, '')
    .replace(/<\/?(video|photo|tweet|instagram|iframe)\d*[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/href="\/(?!\/)/gi, 'href="https://www.espn.com.mx/')
    .replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ')
}

export default function News() {
  const [articles, setArticles] = useState(undefined)
  const [open, setOpen] = useState(null) // artículo de la lista seleccionado

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
      <p className="hint">Cobertura del Mundial por ESPN Deportes. Toca una nota para leerla aquí mismo.</p>
      <div className="news-grid">
        {articles.map((a) => (
          <article
            key={a.id || a.headline}
            className="news-card"
            onClick={() => setOpen(a)}
          >
            {a.image && <img src={a.image} alt="" className="news-img" loading="lazy" />}
            <div className="news-body">
              <span className="news-time">{timeAgo(a.published)}</span>
              <h3 className="news-headline">{a.headline}</h3>
              {a.description && <p className="news-desc">{a.description}</p>}
              <span className="news-source">Leer nota completa →</span>
            </div>
          </article>
        ))}
      </div>
      {open && <ArticleReader meta={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

function ArticleReader({ meta, onClose }) {
  const [article, setArticle] = useState(undefined)

  useEffect(() => {
    let cancel = false
    getArticle(meta.id)
      .then((a) => !cancel && setArticle(a))
      .catch(() => !cancel && setArticle(null))
    return () => { cancel = true }
  }, [meta.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="sheet-body article-scroll">
          {meta.image && <img src={meta.image} alt="" className="article-img" />}
          <h2 className="article-title">{meta.headline}</h2>
          <p className="article-meta">
            {article?.byline ? `${article.byline} · ` : ''}{timeAgo(meta.published)} · ESPN Deportes
          </p>

          {article === undefined && <p className="muted center lineup-msg">Cargando nota…</p>}

          {article === null && (
            <div className="center-card">
              <p className="muted">No pudimos cargar el contenido completo.</p>
              {meta.link && (
                <a className="btn" href={meta.link} target="_blank" rel="noopener noreferrer">
                  Leer en ESPN
                </a>
              )}
            </div>
          )}

          {article && article.story && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: cleanStory(article.story) }}
            />
          )}
          {article && !article.story && article !== undefined && (
            <p className="muted">{meta.description}</p>
          )}

          {article && meta.link && (
            <p className="article-footer">
              <a href={meta.link} target="_blank" rel="noopener noreferrer">
                Ver nota original en ESPN →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
