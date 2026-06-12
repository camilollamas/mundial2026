import { useMemo, useState } from 'react'
import { GROUPS, esName } from '../data/groups.js'
import { flag } from '../data/flags.js'
import squads from '../data/squads.json'

const POS_ORDER = ['GK', 'DF', 'MF', 'FW']
const POS_LABEL = { GK: 'Porteros', DF: 'Defensas', MF: 'Mediocampistas', FW: 'Delanteros' }

const normSearch = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export default function Squads({ fav, setFav }) {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')

  // buscador global de jugadores sobre las plantillas oficiales
  const results = useMemo(() => {
    const q = normSearch(query)
    if (q.length < 2) return null
    const out = []
    for (const [team, squad] of Object.entries(squads)) {
      for (const p of squad.players) {
        if (normSearch(p.name).includes(q)) out.push({ ...p, team })
        if (out.length >= 25) return out
      }
    }
    return out
  }, [query])

  if (selected) {
    const squad = squads[selected]
    return (
      <section>
        <button className="btn ghost" onClick={() => setSelected(null)}>← Volver a equipos</button>
        <div className="squad-head">
          <img src={flag(selected)} alt="" className="badge xl" />
          <div>
            <h2>{esName(selected)}</h2>
            {squad?.coach && (
              <p className="coach-line">
                <span className="muted small">DIRECTOR TÉCNICO</span> {squad.coach}
              </p>
            )}
          </div>
        </div>

        {!squad && <p className="muted center">No hay plantilla registrada para esta selección.</p>}

        {squad && POS_ORDER.map((pos) => {
          const list = squad.players.filter((p) => p.pos === pos)
          if (list.length === 0) return null
          return (
            <div key={pos}>
              <h3 className="date-head">{POS_LABEL[pos]} ({list.length})</h3>
              <div className="players-grid">
                {list.map((p) => (
                  <div key={`${p.no}-${p.name}`} className="player-card">
                    <span className="player-num">{p.no}</span>
                    <div className="player-info">
                      <strong>{p.name}</strong>
                      <p className="muted small">{p.age} años · {p.club}</p>
                      <p className="muted small">{p.caps} PI · {p.goals} goles</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {squad && (
          <p className="muted small center">
            Lista oficial FIFA ({squad.players.length} jugadores) · PI = partidos internacionales.
          </p>
        )}
      </section>
    )
  }

  return (
    <section>
      <p className="hint">
        Toca una selección para ver su plantilla, o márcala con ⭐ como tu favorita.
      </p>

      <input
        className="search-input"
        type="search"
        placeholder="🔍 Buscar jugador (ej. Luis Díaz)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results && (
        <div className="card">
          {results.length === 0 && <p className="muted center">Sin jugadores para esa búsqueda.</p>}
          {results.map((p) => (
            <button
              key={`${p.team}-${p.no}-${p.name}`}
              className="search-row"
              onClick={() => { setSelected(p.team); setQuery('') }}
            >
              <img src={flag(p.team)} alt="" className="badge sm" />
              <span className="rank-team">
                <strong>{p.name}</strong>{' '}
                <span className="muted small">#{p.no} · {esName(p.team)} · {POS_LABEL[p.pos] || p.pos}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {!results && Object.entries(GROUPS).map(([g, names]) => (
        <div key={g}>
          <h3 className="date-head">Grupo {g}</h3>
          <div className="teams-grid">
            {names.map((name) => (
              <button key={name} className="team-tile" onClick={() => setSelected(name)}>
                <span
                  className={`fav-star ${fav === name ? 'active' : ''}`}
                  title={fav === name ? 'Quitar favorita' : 'Marcar como favorita'}
                  onClick={(e) => { e.stopPropagation(); setFav(fav === name ? null : name) }}
                >
                  {fav === name ? '⭐' : '☆'}
                </span>
                <img src={flag(name)} alt="" className="badge lg" loading="lazy" />
                <span>{esName(name)}</span>
                <span className="muted small">{squads[name]?.coach || ''}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
