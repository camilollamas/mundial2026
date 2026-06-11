import { useMemo, useState } from 'react'
import { teamStats, countsForTable } from '../standings.js'
import { esName } from '../data/groups.js'
import { getTimeline, isLive } from '../api.js'

export default function Stats({ matches }) {
  // incluye los partidos en vivo: los goles y tablas se mueven en tiempo real
  const played = useMemo(() => matches.filter(countsForTable), [matches])
  const liveCount = useMemo(() => matches.filter(isLive).length, [matches])
  const stats = useMemo(
    () => teamStats(matches).filter((s) => s.pj > 0),
    [matches]
  )
  const [players, setPlayers] = useState(null) // { goals: Map, yellows: Map, reds: Map }
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [view, setView] = useState('equipos')

  const totalGoals = played.reduce((s, m) => s + (m.hs ?? 0) + (m.as ?? 0), 0)
  const attack = [...stats].sort((a, b) => b.gf - a.gf).slice(0, 10)
  const defense = [...stats].sort((a, b) => a.gc - b.gc || b.pj - a.pj).slice(0, 10)

  // Recorre las cronologías de los partidos jugados y agrega goles y tarjetas
  // por jugador (la API gratuita limita los eventos por partido, ver nota).
  async function loadPlayerStats() {
    setLoading(true)
    const goals = new Map()
    const yellows = new Map()
    const reds = new Map()
    let done = 0
    for (const m of played) {
      try {
        const tl = await getTimeline(m.id)
        for (const ev of tl) {
          const key = `${ev.strPlayer}|${ev.strTeam || ''}`
          if (ev.strTimeline === 'Goal' && !String(ev.strTimelineDetail).includes('Own')) {
            goals.set(key, (goals.get(key) || 0) + 1)
          } else if (ev.strTimeline === 'Card') {
            const map = String(ev.strTimelineDetail).includes('Red') ? reds : yellows
            map.set(key, (map.get(key) || 0) + 1)
          }
        }
      } catch { /* partido sin cronología */ }
      setProgress(++done)
    }
    setPlayers({ goals, yellows, reds })
    setLoading(false)
  }

  const top = (map, n = 10) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

  if (played.length === 0) {
    return (
      <section>
        <div className="card center-card">
          <h3>Aún no hay partidos jugados</h3>
          <p className="muted">
            Las estadísticas de goles, tarjetas y goleadores aparecerán aquí
            apenas ruede el balón. ¡El debut es México vs Sudáfrica en el Azteca!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="stat-tiles">
        <div className="tile">
          <strong>{played.length}</strong>
          <span>Partidos{liveCount > 0 ? ` · ${liveCount} en vivo` : ''}</span>
        </div>
        <div className="tile"><strong>{totalGoals}</strong><span>Goles</span></div>
        <div className="tile">
          <strong>{played.length ? (totalGoals / played.length).toFixed(2) : '0'}</strong>
          <span>Goles por partido</span>
        </div>
      </div>

      <div className="seg-tabs">
        <button
          className={view === 'equipos' ? 'seg active' : 'seg'}
          onClick={() => setView('equipos')}
        >
          🏟️ Equipos
        </button>
        <button
          className={view === 'jugadores' ? 'seg active' : 'seg'}
          onClick={() => {
            setView('jugadores')
            if (!players && !loading) loadPlayerStats()
          }}
        >
          ⚽ Jugadores
        </button>
      </div>

      {view === 'equipos' && (
        <div className="groups-grid">
          <RankCard title="🔥 Mejores ataques" rows={attack} value={(s) => s.gf} suffix="goles" />
          <RankCard title="🧱 Mejores defensas" rows={defense} value={(s) => s.gc} suffix="en contra" />
        </div>
      )}

      {view === 'jugadores' && (
        <div className="card">
          {!players && (
            <p className="muted center">
              {loading
                ? `Analizando partidos… ${progress}/${played.length}`
                : 'Cargando estadísticas de jugadores…'}
            </p>
          )}
          {players && (
            <div className="groups-grid">
              <PlayerList title="⚽ Goleadores" data={top(players.goals)} />
              <PlayerList title="🟨 Amarillas" data={top(players.yellows)} />
              <PlayerList title="🟥 Rojas" data={top(players.reds)} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function RankCard({ title, rows, value, suffix }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {rows.map((s, i) => (
        <div key={s.team} className="rank-row">
          <span className="pos">{i + 1}</span>
          <span className="rank-team">{esName(s.team)}</span>
          <span className="pts">{value(s)} <small className="muted">{suffix}</small></span>
        </div>
      ))}
    </div>
  )
}

function PlayerList({ title, data }) {
  return (
    <div>
      <h4 className="card-title">{title}</h4>
      {data.length === 0 && <p className="muted small">Sin registros todavía.</p>}
      {data.map(([key, count], i) => {
        const [player, team] = key.split('|')
        return (
          <div key={key} className="rank-row">
            <span className="pos">{i + 1}</span>
            <span className="rank-team">{player} <small className="muted">{esName(team)}</small></span>
            <span className="pts">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
