import { useMemo } from 'react'
import { computeStandings, bestThirds, qualificationOutlook } from '../standings.js'
import { GROUPS, esName } from '../data/groups.js'
import { flag } from '../data/flags.js'

export default function Groups({ matches }) {
  const standings = useMemo(() => computeStandings(matches), [matches])
  const thirds = useMemo(() => bestThirds(standings), [standings])
  const outlook = useMemo(() => qualificationOutlook(matches), [matches])

  return (
    <section>
      <p className="hint">
        Avanzan a dieciseisavos los 2 primeros de cada grupo y los 8 mejores terceros.
        Cuando la matemática lo confirme verás <span className="q-chip in">✓</span> (top-2
        asegurado) o <span className="q-chip out">↓</span> (sin opción de top-2).
      </p>
      <div className="groups-grid">
        {Object.keys(GROUPS).map((g) => (
          <div key={g} className="card">
            <h3 className="card-title">Grupo {g}</h3>
            <div className="table-scroll"><table className="table">
              <thead>
                <tr>
                  <th className="left">Selección</th>
                  <th>PJ</th><th>G</th><th>E</th><th>P</th>
                  <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings[g].map((row, i) => (
                  <tr key={row.team} className={i < 2 ? 'qualify' : i === 2 ? 'maybe' : ''}>
                    <td className="left team-cell">
                      <span className="pos">{i + 1}</span>
                      <img src={flag(row.team)} alt="" className="badge sm" loading="lazy" />
                      {esName(row.team)}
                      {row.live && <span className="live-mini" title="Jugando ahora" />}
                      {outlook[row.team] === 'in' && (
                        <span className="q-chip in" title="Top-2 asegurado pase lo que pase">✓</span>
                      )}
                      {outlook[row.team] === 'out' && (
                        <span className="q-chip out" title="Sin opción de top-2; puede aspirar a mejor tercero">↓</span>
                      )}
                    </td>
                    <td>{row.pj}</td><td>{row.g}</td><td>{row.e}</td><td>{row.p}</td>
                    <td>{row.gf}</td><td>{row.gc}</td>
                    <td>{row.gf - row.gc > 0 ? `+${row.gf - row.gc}` : row.gf - row.gc}</td>
                    <td className="pts">{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title">Ranking de terceros (clasifican los 8 primeros)</h3>
        <div className="table-scroll"><table className="table">
          <thead>
            <tr>
              <th className="left">Selección</th><th>Grupo</th>
              <th>PJ</th><th>G</th><th>E</th><th>P</th>
              <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {thirds.map((row, i) => (
              <tr key={row.team} className={i < 8 ? 'qualify' : ''}>
                <td className="left team-cell">
                  <span className="pos">{i + 1}</span>
                  <img src={flag(row.team)} alt="" className="badge sm" loading="lazy" />
                  {esName(row.team)}
                  {row.live && <span className="live-mini" title="Jugando ahora" />}
                </td>
                <td>{row.group}</td>
                <td>{row.pj}</td><td>{row.g}</td><td>{row.e}</td><td>{row.p}</td>
                <td>{row.gf}</td><td>{row.gc}</td>
                <td>{row.gf - row.gc > 0 ? `+${row.gf - row.gc}` : row.gf - row.gc}</td>
                <td className="pts">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </section>
  )
}
