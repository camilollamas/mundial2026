import { useState } from 'react'
import { GROUPS, esName } from '../data/groups.js'
import { flag } from '../data/flags.js'
import squads from '../data/squads.json'

const POS_ORDER = ['GK', 'DF', 'MF', 'FW']
const POS_LABEL = { GK: 'Porteros', DF: 'Defensas', MF: 'Mediocampistas', FW: 'Delanteros' }

export default function Squads() {
  const [selected, setSelected] = useState(null)

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
      <p className="hint">Toca una selección para ver su plantilla completa y su técnico.</p>
      {Object.entries(GROUPS).map(([g, names]) => (
        <div key={g}>
          <h3 className="date-head">Grupo {g}</h3>
          <div className="teams-grid">
            {names.map((name) => (
              <button key={name} className="team-tile" onClick={() => setSelected(name)}>
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
