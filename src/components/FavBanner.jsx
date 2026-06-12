import { useEffect, useMemo, useState } from 'react'
import { esName, TEAM_GROUP } from '../data/groups.js'
import { flag } from '../data/flags.js'
import { computeStandings } from '../standings.js'
import { isFinished, isLive } from '../api.js'

function countdown(ts, now) {
  const ms = new Date(ts + 'Z').getTime() - now
  if (ms <= 0) return 'por comenzar'
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const min = mins % 60
  if (d > 0) return `en ${d}d ${h}h`
  if (h > 0) return `en ${h}h ${min}m`
  return `en ${min} min`
}

// Banner fijo con el próximo partido y la posición de tu selección.
export default function FavBanner({ fav, matches }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const data = useMemo(() => {
    if (!fav) return null
    const mine = matches
      .filter((m) => m.home === fav || m.away === fav)
      .sort((a, b) => (a.ts < b.ts ? -1 : 1))
    const liveM = mine.find(isLive)
    const next = mine.find((m) => !isFinished(m) && !isLive(m))
    const group = TEAM_GROUP[fav]
    const rows = computeStandings(matches)[group] || []
    const pos = rows.findIndex((r) => r.team === fav) + 1
    const row = rows[pos - 1]
    return { liveM, next, group, pos, row }
  }, [fav, matches])

  if (!fav || !data) return null
  const { liveM, next, group, pos, row } = data
  const rival = (m) => esName(m.home === fav ? m.away : m.home)

  return (
    <div className={`fav-banner ${liveM ? 'fav-live' : ''}`}>
      <img src={flag(fav)} alt="" className="badge" />
      <div className="fav-info">
        <span className="fav-name">
          {esName(fav)}
          <span className="fav-pos">{pos}º Grupo {group} · {row?.pts ?? 0} pts</span>
        </span>
        {liveM ? (
          <span className="fav-next live-text">
            EN VIVO vs {rival(liveM)} · {liveM.hs}-{liveM.as}{liveM.clock ? ` · ${liveM.clock}` : ''}
          </span>
        ) : next ? (
          <span className="fav-next">
            vs {rival(next)} {countdown(next.ts, now)} ·{' '}
            {new Date(next.ts + 'Z').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
            {new Date(next.ts + 'Z').toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="fav-next muted">Sin partidos pendientes</span>
        )}
      </div>
    </div>
  )
}
