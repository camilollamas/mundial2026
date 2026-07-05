// Cuadro oficial del Mundial 2026. Orden del array = orden visual del bracket:
// pares consecutivos alimentan octavos, y esa adyacencia se propaga correcta a
// cuartos/semis/final (verificado contra la estructura de ESPN: SF1 = QF de los
// partidos 89·90 + 93·94; SF2 = 91·92 + 95·96). Cada slot es 1º (W), 2º (R) o
// mejor tercero (3, con la lista de grupos posibles). NO reordenar sin re-validar
// la adyacencia hasta la final.
export const R32_SLOTS = [
  { match: 74, a: { t: 'W', g: 'E' }, b: { t: '3', from: ['A', 'B', 'C', 'D', 'F'] } },
  { match: 77, a: { t: 'W', g: 'I' }, b: { t: '3', from: ['C', 'D', 'F', 'G', 'H'] } },
  { match: 73, a: { t: 'R', g: 'A' }, b: { t: 'R', g: 'B' } },
  { match: 75, a: { t: 'W', g: 'F' }, b: { t: 'R', g: 'C' } },
  { match: 83, a: { t: 'R', g: 'K' }, b: { t: 'R', g: 'L' } },
  { match: 84, a: { t: 'W', g: 'H' }, b: { t: 'R', g: 'J' } },
  { match: 81, a: { t: 'W', g: 'D' }, b: { t: '3', from: ['B', 'E', 'F', 'I', 'J'] } },
  { match: 82, a: { t: 'W', g: 'G' }, b: { t: '3', from: ['A', 'E', 'H', 'I', 'J'] } },
  { match: 76, a: { t: 'W', g: 'C' }, b: { t: 'R', g: 'F' } },
  { match: 78, a: { t: 'R', g: 'E' }, b: { t: 'R', g: 'I' } },
  { match: 79, a: { t: 'W', g: 'A' }, b: { t: '3', from: ['C', 'E', 'F', 'H', 'I'] } },
  { match: 80, a: { t: 'W', g: 'L' }, b: { t: '3', from: ['E', 'H', 'I', 'J', 'K'] } },
  { match: 86, a: { t: 'W', g: 'J' }, b: { t: 'R', g: 'H' } },
  { match: 88, a: { t: 'R', g: 'D' }, b: { t: 'R', g: 'G' } },
  { match: 85, a: { t: 'W', g: 'B' }, b: { t: '3', from: ['E', 'F', 'G', 'I', 'J'] } },
  { match: 87, a: { t: 'W', g: 'K' }, b: { t: '3', from: ['D', 'E', 'I', 'J', 'L'] } },
]

const POS_LABEL = { W: '1º', R: '2º' }

// Asigna los 8 mejores terceros (sus grupos) a los 8 slots de tercero
// respetando la lista de grupos permitida de cada slot. Backtracking simple.
function assignThirds(thirdGroups, slots) {
  const order = [...slots.keys()].sort(
    (i, j) => slots[i].from.length - slots[j].from.length
  )
  const result = {}
  const used = new Set()
  const solve = (k) => {
    if (k === order.length) return true
    const slotIdx = order[k]
    for (const g of slots[slotIdx].from) {
      if (thirdGroups.includes(g) && !used.has(g)) {
        used.add(g)
        result[slotIdx] = g
        if (solve(k + 1)) return true
        used.delete(g)
      }
    }
    return false
  }
  return solve(0) ? result : null
}

// Proyecta los dieciseisavos a partir de las posiciones provisionales de grupo.
// standings: { A: [filas ordenadas], ... }; thirds: array de filas de terceros.
// Devuelve 16 cruces { match, home, away, homeLabel, awayLabel } en orden de
// bracket; los equipos pueden ser null si el grupo aún no tiene la posición.
export function projectR32(standings, thirds) {
  const top8 = thirds.slice(0, 8)
  const thirdGroups = top8.map((r) => r.group)
  const thirdByGroup = Object.fromEntries(top8.map((r) => [r.group, r.team]))

  const thirdSlots = R32_SLOTS.map((s, i) => ({ i, slot: s })).filter(
    ({ slot }) => slot.a.t === '3' || slot.b.t === '3'
  )
  // los slots de tercero solo están en el lado b en este cuadro
  const slotsForAssign = thirdSlots.map(({ slot }) => ({ from: slot.b.from }))
  const assignment = assignThirds(thirdGroups, slotsForAssign)
  const thirdGroupByMatch = {}
  if (assignment) {
    thirdSlots.forEach(({ i }, k) => {
      thirdGroupByMatch[R32_SLOTS[i].match] = assignment[k]
    })
  }

  const resolve = (slot, match) => {
    if (slot.t === 'W') {
      return { team: standings[slot.g]?.[0]?.team || null, label: `1º ${slot.g}` }
    }
    if (slot.t === 'R') {
      return { team: standings[slot.g]?.[1]?.team || null, label: `2º ${slot.g}` }
    }
    // tercero
    const g = thirdGroupByMatch[match]
    return {
      team: g ? thirdByGroup[g] : null,
      label: g ? `3º ${g}` : '3º ?',
    }
  }

  return R32_SLOTS.map((s) => {
    const a = resolve(s.a, s.match)
    const b = resolve(s.b, s.match)
    return {
      match: s.match,
      home: a.team,
      away: b.team,
      homeLabel: a.label,
      awayLabel: b.label,
    }
  })
}

export { POS_LABEL }
