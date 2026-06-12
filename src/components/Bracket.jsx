import MatchCard from './MatchCard.jsx'
import { KO_STAGES } from '../data/groups.js'
import { flag } from '../data/flags.js'
import { isFinished } from '../api.js'

const STAGE_DATES = {
  r32: '28 jun – 3 jul', r16: '4 – 7 jul', qf: '9 – 11 jul',
  sf: '14 – 15 jul', third: '18 jul', final: '19 jul · MetLife Stadium, NY/NJ',
}

// Mapa visual del cuadro: columnas conectadas estilo TV, scroll horizontal.
function BracketMap({ matches }) {
  const stages = ['r32', 'r16', 'qf', 'sf', 'final']
  const labels = { r32: '16avos', r16: 'Octavos', qf: 'Cuartos', sf: 'Semis', final: 'Final' }
  const slotW = 64
  const slotH = 30
  const hGap = 30
  const vUnit = 40
  const top = 26

  const byStage = Object.fromEntries(
    stages.map((s) => [
      s,
      matches.filter((m) => m.stage === s).sort((a, b) => (a.ts < b.ts ? -1 : 1)),
    ])
  )
  const centerY = (k, i) => top + vUnit * 2 ** k * (i + 0.5)
  const colX = (k) => k * (slotW + hGap)
  const width = stages.length * (slotW + hGap) - hGap
  const height = top + vUnit * 16 + 8

  return (
    <div className="bracket-map-wrap card">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} className="bracket-map">
        {stages.map((s, k) => (
          <g key={s}>
            <text x={colX(k) + slotW / 2} y={14} className="bm-label" textAnchor="middle">
              {labels[s]}
            </text>
            {Array.from({ length: 16 / 2 ** k }).map((_, i) => {
              const m = byStage[s][i]
              const cy = centerY(k, i)
              const x = colX(k)
              return (
                <g key={i}>
                  {k < stages.length - 1 && (
                    <path
                      d={`M ${x + slotW} ${cy} H ${x + slotW + hGap / 2} V ${centerY(k + 1, Math.floor(i / 2))} H ${x + slotW + hGap}`}
                      className="bm-line"
                    />
                  )}
                  <rect
                    x={x} y={cy - slotH / 2} width={slotW} height={slotH} rx="6"
                    className={m ? 'bm-slot filled' : 'bm-slot'}
                  />
                  {m ? (
                    <>
                      <image href={flag(m.home)} x={x + 5} y={cy - 12} width="16" height="12" />
                      <image href={flag(m.away)} x={x + 5} y={cy + 1} width="16" height="12" />
                      <text x={x + 27} y={cy - 2.5} className="bm-score">{m.hs ?? ''}</text>
                      <text x={x + 27} y={cy + 10.5} className="bm-score">{m.as ?? ''}</text>
                    </>
                  ) : (
                    <text x={x + slotW / 2} y={cy + 4} className="bm-tbd" textAnchor="middle">—</text>
                  )}
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function Bracket({ matches, groupMatches }) {
  const groupsDone = groupMatches.filter(isFinished).length

  return (
    <section>
      <p className="hint">
        Fase final a eliminación directa: 32 equipos, del 28 de junio al 19 de julio.
        Los cruces aparecen aquí automáticamente cuando se definen. Desliza el mapa →
      </p>

      <BracketMap matches={matches} />

      <div className="bracket-stack">
        {KO_STAGES.map((stage) => {
          const stageMatches = matches.filter((m) => m.stage === stage.key)
          const pending = stage.slots - stageMatches.length
          return (
            <div key={stage.key} className="stage-col">
              <h3 className="stage-title">
                {stage.name}
                <span className="stage-dates">{STAGE_DATES[stage.key]}</span>
              </h3>
              <div className="stage-matches">
                {stageMatches.map((m) => <MatchCard key={m.id} m={m} allMatches={groupMatches} />)}
                {pending > 0 && (
                  <div className="match placeholder">
                    <span className="muted">
                      {pending === 1 ? '1 partido por definirse' : `${pending} partidos por definirse`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {groupsDone < 72 && (
        <p className="muted center">
          Fase de grupos: {groupsDone}/72 partidos jugados.
        </p>
      )}
    </section>
  )
}
