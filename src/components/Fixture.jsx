import { useEffect, useMemo, useState } from 'react'
import MatchCard from './MatchCard.jsx'
import { GROUPS, TEAM_GROUP, esName } from '../data/groups.js'
import { isFinished, isLive } from '../api.js'

const fmtDate = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

// fecha local (no UTC) en formato YYYY-MM-DD
const toLocalISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// fecha del partido en la zona horaria del usuario (el kickoff se guarda en UTC)
const matchLocalDate = (m) => toLocalISO(new Date(m.ts + 'Z'))

// cuenta regresiva al próximo partido (se refresca cada 30 s)
function NextCountdown({ m }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const mins = Math.max(0, Math.floor((new Date(m.ts + 'Z').getTime() - now) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const mm = mins % 60
  const txt = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${mm}m` : `${mm} min`
  return (
    <p className="countdown">
      ⏳ Próximo: <strong>{esName(m.home)} vs {esName(m.away)}</strong> en <strong>{txt}</strong>
    </p>
  )
}

export default function Fixture({ matches }) {
  const [group, setGroup] = useState('all')
  const [team, setTeam] = useState('all')
  const [view, setView] = useState('auto')
  const today = toLocalISO(new Date())

  const filtered = useMemo(() => {
    let list = matches
    if (group !== 'all') list = list.filter((m) => TEAM_GROUP[m.home] === group || TEAM_GROUP[m.away] === group)
    if (team !== 'all') list = list.filter((m) => m.home === team || m.away === team)
    return [...list].sort((a, b) => (a.ts < b.ts ? -1 : 1))
  }, [matches, group, team])

  // tres vistas: finalizados (recientes primero), en vivo y próximos.
  // 'auto' (estado inicial) abre En vivo si hay partidos en curso.
  const finished = useMemo(() => filtered.filter(isFinished).reverse(), [filtered])
  const live = useMemo(() => filtered.filter(isLive), [filtered])
  const upcoming = useMemo(
    () => filtered.filter((m) => !isFinished(m) && !isLive(m)),
    [filtered]
  )
  const resolved = view === 'auto' ? (live.length > 0 ? 'live' : 'upcoming') : view
  const shown = resolved === 'finished' ? finished : resolved === 'live' ? live : upcoming

  const byDate = useMemo(() => {
    const map = new Map()
    for (const m of shown) {
      const d = matchLocalDate(m)
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(m)
    }
    return [...map.entries()]
  }, [shown])

  const teams = Object.keys(TEAM_GROUP).sort((a, b) => esName(a).localeCompare(esName(b)))

  return (
    <section>
      <div className="filters">
        <select value={group} onChange={(e) => { setGroup(e.target.value); setTeam('all') }}>
          <option value="all">Todos los grupos</option>
          {Object.keys(GROUPS).map((g) => <option key={g} value={g}>Grupo {g}</option>)}
        </select>
        <select value={team} onChange={(e) => { setTeam(e.target.value); setGroup('all') }}>
          <option value="all">Todas las selecciones</option>
          {teams.map((t) => <option key={t} value={t}>{esName(t)}</option>)}
        </select>
      </div>

      <div className="seg-tabs">
        <button
          className={resolved === 'finished' ? 'seg active' : 'seg'}
          onClick={() => setView('finished')}
        >
          Finalizados ({finished.length})
        </button>
        <button
          className={resolved === 'live' ? 'seg active' : 'seg'}
          onClick={() => setView('live')}
        >
          En vivo ({live.length})
          {live.length > 0 && <span className="live-mini" />}
        </button>
        <button
          className={resolved === 'upcoming' ? 'seg active' : 'seg'}
          onClick={() => setView('upcoming')}
        >
          Próximos ({upcoming.length})
        </button>
      </div>

      {resolved === 'live' && live.length === 0 && (
        <div className="card center-card">
          <p className="muted">No hay partidos en juego en este momento.</p>
          {upcoming[0] && <NextCountdown m={upcoming[0]} />}
        </div>
      )}

      {byDate.map(([date, list]) => (
        <div key={date} id={date === today ? 'today' : undefined}>
          <h2 className={`date-head ${date === today ? 'today' : ''}`}>
            {fmtDate(date)} {date === today && <span className="chip">HOY</span>}
          </h2>
          {list.map((m) => <MatchCard key={m.id} m={m} allMatches={matches} />)}
        </div>
      ))}
      {byDate.length === 0 && resolved !== 'live' && (
        <p className="muted center">Sin partidos para este filtro.</p>
      )}
    </section>
  )
}
