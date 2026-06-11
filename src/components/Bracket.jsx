import MatchCard from './MatchCard.jsx'
import { KO_STAGES } from '../data/groups.js'
import { isFinished } from '../api.js'

const STAGE_DATES = {
  r32: '28 jun – 3 jul', r16: '4 – 7 jul', qf: '9 – 11 jul',
  sf: '14 – 15 jul', third: '18 jul', final: '19 jul · MetLife Stadium, NY/NJ',
}

export default function Bracket({ matches, groupMatches }) {
  const groupsDone = groupMatches.filter(isFinished).length

  return (
    <section>
      <p className="hint">
        Fase final a eliminación directa: 32 equipos, del 28 de junio al 19 de julio.
        Los cruces aparecen aquí automáticamente cuando se definen.
      </p>
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
