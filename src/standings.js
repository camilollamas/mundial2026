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

// Escenarios de clasificación por fuerza bruta sobre los partidos de grupo
// pendientes (W/D/L, máx. 4 → 81 combinaciones). Devuelve por equipo:
// 'in' = top-2 asegurado pase lo que pase (aun perdiendo los desempates),
// 'out' = sin opción matemática de top-2 (puede aspirar a mejor tercero),
// undefined = depende de resultados.
export function qualificationOutlook(matches) {
  const result = {}
  for (const [g, teams] of Object.entries(GROUPS)) {
    const gm = matches.filter(
      (m) => TEAM_GROUP[m.home] === g && TEAM_GROUP[m.away] === g
    )
    const played = gm.filter(countsForTable)
    const unplayed = gm.filter((m) => !countsForTable(m))
    if (unplayed.length === 0 || unplayed.length > 4) continue

    const basePts = Object.fromEntries(teams.map((t) => [t, 0]))
    for (const m of played) {
      if (m.hs > m.as) basePts[m.home] += 3
      else if (m.hs < m.as) basePts[m.away] += 3
      else { basePts[m.home] += 1; basePts[m.away] += 1 }
    }

    const alwaysIn = Object.fromEntries(teams.map((t) => [t, true]))
    const everIn = Object.fromEntries(teams.map((t) => [t, false]))
    const combos = 3 ** unplayed.length
    for (let c = 0; c < combos; c++) {
      const pts = { ...basePts }
      let x = c
      for (const m of unplayed) {
        const r = x % 3
        x = (x - r) / 3
        if (r === 0) pts[m.home] += 3
        else if (r === 1) pts[m.away] += 3
        else { pts[m.home] += 1; pts[m.away] += 1 }
      }
      for (const t of teams) {
        const strictlyAbove = teams.filter((o) => o !== t && pts[o] > pts[t]).length
        const aboveOrTied = teams.filter((o) => o !== t && pts[o] >= pts[t]).length
        // pesimista (desempates en contra) para asegurar; optimista para descartar
        if (aboveOrTied > 1) alwaysIn[t] = false
        if (strictlyAbove <= 1) everIn[t] = true
      }
    }
    for (const t of teams) {
      if (alwaysIn[t]) result[t] = 'in'
      else if (!everIn[t]) result[t] = 'out'
    }
  }
  return result
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
