import { useEffect, useMemo, useState } from 'react'
import MatchCard from './MatchCard.jsx'
import { esName } from '../data/groups.js'
import { isFinished, isLive } from '../api.js'

const toLocalISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const matchLocalDate = (m) => toLocalISO(new Date(m.ts + 'Z'))

function countdown(ts, now) {
  const mins = Math.max(0, Math.floor((new Date(ts + 'Z').getTime() - now) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const mm = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${mm}m`
  return `${mm} min`
}

// Centro del día: un vistazo a lo que pasa hoy sin navegar entre pestañas.
export default function Home({ matches, setTab }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const today = toLocalISO(new Date())
  const live = useMemo(() => matches.filter(isLive), [matches])
  const todayMatches = useMemo(
    () => matches.filter((m) => matchLocalDate(m) === today && !isLive(m)).sort((a, b) => (a.ts < b.ts ? -1 : 1)),
    [matches, today]
  )
  const next = useMemo(
    () =>
      matches
        .filter((m) => !isFinished(m) && !isLive(m) && new Date(m.ts + 'Z').getTime() > now)
        .sort((a, b) => (a.ts < b.ts ? -1 : 1))[0],
    [matches, now]
  )

  // resumen del torneo (incluye lo que va de los partidos en vivo)
  const summary = useMemo(() => {
    const counted = matches.filter((m) => isFinished(m) || isLive(m))
    const goals = counted.reduce((s, m) => s + (m.hs ?? 0) + (m.as ?? 0), 0)
    const played = matches.filter(isFinished).length
    return { played, goals, avg: played ? (goals / played).toFixed(2) : '0' }
  }, [matches])

  return (
    <section>
      <div className="stat-tiles">
        <div className="tile"><strong>{summary.played}</strong><span>Jugados</span></div>
        <div className="tile"><strong>{summary.goals}</strong><span>Goles</span></div>
        <div className="tile"><strong>{summary.avg}</strong><span>Goles/partido</span></div>
      </div>

      {live.length > 0 && (
        <>
          <h3 className="date-head today">
            En vivo ahora <span className="live-mini" />
          </h3>
          {live.map((m) => <MatchCard key={m.id} m={m} allMatches={matches} />)}
        </>
      )}

      {todayMatches.length > 0 && (
        <>
          <h3 className="date-head">Partidos de hoy</h3>
          {todayMatches.map((m) => <MatchCard key={m.id} m={m} allMatches={matches} />)}
        </>
      )}

      {live.length === 0 && todayMatches.length === 0 && next && (
        <>
          <h3 className="date-head">Próximo partido</h3>
          <div className="card center-card">
            <p className="countdown">
              ⏳ <strong>{esName(next.home)} vs {esName(next.away)}</strong> en{' '}
              <strong>{countdown(next.ts, now)}</strong>
            </p>
            <p className="muted small">
              {new Date(next.ts + 'Z').toLocaleString('es', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <MatchCard m={next} allMatches={matches} />
        </>
      )}

      <button className="btn ghost home-all" onClick={() => setTab('fixture')}>
        Ver todo el fixture →
      </button>
    </section>
  )
}
