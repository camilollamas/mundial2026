import { GROUPS, TEAM_GROUP } from './data/groups.js'
import { isFinished, isLive } from './api.js'

// Cuenta también los partidos en vivo: la tabla se mueve en tiempo real
// con resultados provisionales mientras ruedan los partidos.
export const countsForTable = (m) =>
  m.hs !== null && m.as !== null && (isFinished(m) || isLive(m))

// Calcula la tabla de cada grupo a partir de los resultados (criterio FIFA:
// puntos, diferencia de gol, goles a favor, enfrentamiento directo simplificado).
export function computeStandings(matches) {
  const rows = {}
  for (const [group, teams] of Object.entries(GROUPS)) {
    for (const t of teams) {
      rows[t] = { team: t, group, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, live: false }
    }
  }

  for (const m of matches) {
    if (isLive(m) && rows[m.home] && rows[m.away]) {
      rows[m.home].live = true
      rows[m.away].live = true
    }
    if (!countsForTable(m)) continue
    const h = rows[m.home]
    const a = rows[m.away]
    if (!h || !a) continue
    h.pj++; a.pj++
    h.gf += m.hs; h.gc += m.as
    a.gf += m.as; a.gc += m.hs
    if (m.hs > m.as) { h.g++; h.pts += 3; a.p++ }
    else if (m.hs < m.as) { a.g++; a.pts += 3; h.p++ }
    else { h.e++; a.e++; h.pts++; a.pts++ }
  }

  const byGroup = {}
  for (const [group, teams] of Object.entries(GROUPS)) {
    byGroup[group] = teams
      .map((t) => rows[t])
      .sort((x, y) =>
        y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.team.localeCompare(y.team)
      )
  }
  return byGroup
}

// Los 8 mejores terceros también clasifican a dieciseisavos.
export function bestThirds(byGroup) {
  return Object.values(byGroup)
    .map((rows) => rows[2])
    .sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf)
}

export function teamStats(matches) {
  const stats = {}
  for (const t of Object.keys(TEAM_GROUP)) stats[t] = { team: t, pj: 0, gf: 0, gc: 0 }
  for (const m of matches) {
    if (!countsForTable(m)) continue
    if (stats[m.home]) { stats[m.home].pj++; stats[m.home].gf += m.hs; stats[m.home].gc += m.as }
    if (stats[m.away]) { stats[m.away].pj++; stats[m.away].gf += m.as; stats[m.away].gc += m.hs }
  }
  return Object.values(stats)
}
