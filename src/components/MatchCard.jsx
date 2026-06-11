import { useState } from 'react'
import { esName, TEAM_GROUP } from '../data/groups.js'
import { flag } from '../data/flags.js'
import { isLive } from '../api.js'
import MatchDetail from './MatchDetail.jsx'

const STATUS_ES = {
  NS: null, FT: 'Final', AET: 'Final (prórroga)', PEN: 'Final (penales)',
  '1H': '1er tiempo', '2H': '2do tiempo', HT: 'Descanso', ET: 'Prórroga',
  P: 'Penales', POST: 'Pospuesto', CANC: 'Cancelado',
}

function kickoff(m) {
  const d = new Date(m.ts + 'Z')
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function MatchCard({ m, allMatches = [] }) {
  const [open, setOpen] = useState(false)
  const played = m.hs !== null && m.as !== null
  const live = isLive(m)
  const group = TEAM_GROUP[m.home] === TEAM_GROUP[m.away] ? TEAM_GROUP[m.home] : null

  return (
    <>
      <div className={`match ${live ? 'match-live' : ''}`} onClick={() => setOpen(true)}>
        <div className="match-meta">
          <span className="meta-group">{group ? `Grupo ${group}` : etapaLabel(m.stage)}</span>
          <span className="meta-venue">{m.venue}{m.country ? ` · ${m.country}` : ''}</span>
        </div>
        <div className="match-row">
          <div className="match-team">
            <img src={flag(m.home)} alt="" className="badge" loading="lazy" />
            <span className="team-name">{esName(m.home)}</span>
          </div>
          <div className="match-score">
            {played || live ? (
              <span className={live ? 'score live' : 'score'}>{m.hs ?? 0} - {m.as ?? 0}</span>
            ) : (
              <span className="score time">{kickoff(m)}</span>
            )}
            {(STATUS_ES[m.status] || (live && m.status)) && (
              <span className={`status ${live ? 'status-live' : ''}`}>
                {STATUS_ES[m.status] || m.status}
              </span>
            )}
          </div>
          <div className="match-team">
            <img src={flag(m.away)} alt="" className="badge" loading="lazy" />
            <span className="team-name">{esName(m.away)}</span>
          </div>
        </div>
      </div>
      {open && <MatchDetail m={m} allMatches={allMatches} onClose={() => setOpen(false)} />}
    </>
  )
}

function etapaLabel(stage) {
  return {
    r32: 'Dieciseisavos', r16: 'Octavos', qf: 'Cuartos',
    sf: 'Semifinal', third: 'Tercer puesto', final: 'FINAL',
  }[stage] || 'Eliminatoria'
}
