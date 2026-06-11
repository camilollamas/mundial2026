import { useMemo, useState } from 'react'
import { GROUPS, esName } from '../data/groups.js'
import { getPlayers } from '../api.js'
import squads from '../data/squads.json'

const POS_ORDER = ['GK', 'DF', 'MF', 'FW']
const POS_LABEL = { GK: 'Porteros', DF: 'Defensas', MF: 'Mediocampistas', FW: 'Delanteros' }

// normaliza nombres para cruzar Wikipedia con las fotos de TheSportsDB
const norm = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export default function Squads({ matches }) {
  // ids y escudos de los 48 equipos, derivados de los partidos.
  const teams = useMemo(() => {
    const map = {}
    for (const m of matches) {
      map[m.home] = { id: m.homeId, badge: m.hb }
      map[m.away] = { id: m.awayId, badge: m.ab }
    }
    return map
  }, [matches])

  const [selected, setSelected] = useState(null)
  const [photos, setPhotos] = useState({})

  async function open(name) {
    setSelected(name)
    setPhotos({})
    try {
      const apiPlayers = await getPlayers(teams[name].id)
      const map = {}
      for (const p of apiPlayers) {
        if (p.strCutout || p.strThumb) map[norm(p.strPlayer)] = p.strCutout || p.strThumb
      }
      setPhotos(map)
    } catch {
      /* sin fotos: la plantilla se muestra igual */
    }
  }

  if (selected) {
    const t = teams[selected]
    const squad = squads[selected]
    return (
      <section>
        <button className="btn ghost" onClick={() => setSelected(null)}>← Volver a equipos</button>
        <div className="squad-head">
          <img src={t?.badge} alt="" className="badge xl" />
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
                {list.map((p) => {
                  const photo = photos[norm(p.name)]
                  return (
                    <div key={`${p.no}-${p.name}`} className="player-card">
                      {photo ? (
                        <img src={photo} alt="" className="player-photo" loading="lazy" />
                      ) : (
                        <div className="player-photo placeholder-photo">{p.no}</div>
                      )}
                      <div className="player-info">
                        <strong>{p.name}</strong>
                        <p className="muted small">
                          #{p.no} · {p.age} años · {p.club}
                        </p>
                        <p className="muted small">
                          {p.caps} PI · {p.goals} goles
                        </p>
                      </div>
                    </div>
                  )
                })}
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
              <button key={name} className="team-tile" onClick={() => open(name)}>
                <img src={teams[name]?.badge} alt="" className="badge lg" loading="lazy" />
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
