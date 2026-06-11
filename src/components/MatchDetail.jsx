import { useEffect, useState } from 'react'
import { TEAM_GROUP, esName } from '../data/groups.js'
import { flag } from '../data/flags.js'
import { winProbability } from '../data/ratings.js'
import { computeStandings } from '../standings.js'
import { getTimeline, getLineups, isLive } from '../api.js'

export default function MatchDetail({ m, allMatches = [], onClose }) {
  const [tab, setTab] = useState('stats')
  const [timeline, setTimeline] = useState(null)
  const played = m.hs !== null && m.as !== null
  const live = isLive(m)
  const group = TEAM_GROUP[m.home] === TEAM_GROUP[m.away] ? TEAM_GROUP[m.home] : null

  useEffect(() => {
    if (played || live) {
      getTimeline(m.id).then(setTimeline).catch(() => setTimeline([]))
    }
  }, [m.id, played, live])

  // cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="sheet-head">
          <div className="sheet-team">
            <img src={flag(m.home)} alt="" className="badge lg" />
            <span>{esName(m.home)}</span>
          </div>
          <div className="sheet-score">
            {played || live ? (
              <strong className={live ? 'live-text' : ''}>{m.hs ?? 0} - {m.as ?? 0}</strong>
            ) : (
              <strong>{new Date(m.ts + 'Z').toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</strong>
            )}
            <span className="muted small">{group ? `Grupo ${group}` : 'Eliminatoria'}</span>
          </div>
          <div className="sheet-team">
            <img src={flag(m.away)} alt="" className="badge lg" />
            <span>{esName(m.away)}</span>
          </div>
        </div>

        <div className="dtabs">
          <button className={tab === 'lineups' ? 'dtab active' : 'dtab'} onClick={() => setTab('lineups')}>
            Alineaciones
          </button>
          <button className={tab === 'stats' ? 'dtab active' : 'dtab'} onClick={() => setTab('stats')}>
            Estadísticas
          </button>
        </div>

        <div className="sheet-body">
          {tab === 'stats' ? (
            <StatsTab m={m} group={group} allMatches={allMatches} timeline={timeline} played={played} live={live} />
          ) : (
            <LineupsTab m={m} />
          )}
        </div>
      </div>
    </div>
  )
}

function StatsTab({ m, group, allMatches, timeline, played, live }) {
  const prob = winProbability(m.home, m.away)
  const standings = group ? computeStandings(allMatches)[group] : null

  return (
    <>
      <h4 className="sheet-section">Probabilidad de victoria</h4>
      <div className="prob-labels">
        <div className="prob-label"><span>{esName(m.home)}</span><strong className="prob-home">{prob.home}%</strong></div>
        <div className="prob-label center"><span>Empate</span><strong>{prob.draw}%</strong></div>
        <div className="prob-label right"><span>{esName(m.away)}</span><strong className="prob-away">{prob.away}%</strong></div>
      </div>
      <div className="prob-bar">
        <div className="prob-seg home" style={{ width: `${prob.home}%` }} />
        <div className="prob-seg draw" style={{ width: `${prob.draw}%` }} />
        <div className="prob-seg away" style={{ width: `${prob.away}%` }} />
      </div>
      <p className="muted small">Estimación según rating de cada selección.</p>

      {(played || live) && timeline && timeline.length > 0 && (
        <>
          <h4 className="sheet-section">Incidencias</h4>
          <div className="timeline">
            {timeline.map((ev, i) => (
              <div key={i} className="timeline-item">
                <span className="tl-min">{ev.intTime}&apos;</span>
                <span className="tl-icon">
                  {ev.strTimeline === 'Goal' ? '⚽' : ev.strTimeline === 'Card'
                    ? (String(ev.strTimelineDetail).includes('Red') ? '🟥' : '🟨')
                    : '🔁'}
                </span>
                <span>{ev.strPlayer}</span>
                <span className="muted">{esName(ev.strTeam || '')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {standings && (
        <>
          <h4 className="sheet-section">Posiciones · Grupo {group}</h4>
          <table className="table">
            <thead>
              <tr>
                <th className="left">Equipo</th>
                <th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.team}
                  className={`${i < 2 ? 'qualify' : i === 2 ? 'maybe' : ''} ${row.team === m.home || row.team === m.away ? 'highlight' : ''}`}
                >
                  <td className="left team-cell"><span className="pos">{i + 1}</span>{esName(row.team)}</td>
                  <td>{row.pj}</td><td>{row.g}</td><td>{row.e}</td><td>{row.p}</td>
                  <td>{row.gf}</td><td>{row.gc}</td>
                  <td>{row.gf - row.gc > 0 ? `+${row.gf - row.gc}` : row.gf - row.gc}</td>
                  <td className="pts">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="legend">
            <span className="legend-item"><span className="legend-dot qualify-dot" /> Fase de eliminación directa</span>
            <span className="legend-item"><span className="legend-dot maybe-dot" /> Posible mejor tercero</span>
          </div>
        </>
      )}

      <p className="venue-line">
        <span className="muted">Lugar:</span> {m.venue}{m.country ? `, ${m.country}` : ''}
      </p>
    </>
  )
}

function LineupsTab({ m }) {
  const [lineups, setLineups] = useState(undefined) // undefined=cargando, null=sin definir

  useEffect(() => {
    let cancel = false
    getLineups(m)
      .then((data) => !cancel && setLineups(data))
      .catch(() => !cancel && setLineups(null))
    return () => { cancel = true }
  }, [m.id])

  if (lineups === undefined) {
    return <p className="muted center lineup-msg">Consultando alineaciones…</p>
  }

  if (lineups === null) {
    return (
      <div className="lineup-empty">
        <span className="lineup-empty-icon">📋</span>
        <strong>Alineaciones aún sin definir</strong>
        <p className="muted small">
          El once inicial se publica aproximadamente una hora antes del partido.
          Vuelve a abrir el detalle más cerca del pitazo.
        </p>
      </div>
    )
  }

  return (
    <div className="lineups">
      {[m.home, m.away].map((name) => {
        const side = lineups[name]
        const t = { name }
        return (
          <div key={t.name} className="lineup-col">
            <div className="lineup-head">
              <img src={flag(t.name)} alt="" className="badge" />
              <strong>{esName(t.name)}</strong>
              {side.formation && <span className="formation-pill">{side.formation}</span>}
            </div>
            <h5 className="lineup-pos">Titulares</h5>
            {side.starters.map((p) => (
              <div key={`${p.jersey}-${p.name}`} className="lineup-row">
                <span className="lineup-no">{p.jersey}</span>
                <span className="lineup-name">{p.name}</span>
                <span className="muted small">{p.pos}</span>
              </div>
            ))}
            <h5 className="lineup-pos">Suplentes</h5>
            {side.subs.map((p) => (
              <div key={`${p.jersey}-${p.name}`} className="lineup-row sub">
                <span className="lineup-no">{p.jersey}</span>
                <span className="lineup-name">
                  {p.name} {p.subbedIn && <span title="Ingresó">🔁</span>}
                </span>
                <span className="muted small">{p.pos}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
