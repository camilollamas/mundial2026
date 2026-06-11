// Convierte el wikitext de "2026 FIFA World Cup squads" (Wikipedia) en
// src/data/squads.json con plantillas completas: técnico + 26 jugadores.
// Uso: node scripts/build-squads.mjs   (descarga si no existe el .txt)
import { readFileSync, writeFileSync, existsSync } from 'fs'

const TXT = new URL('./squads-wikitext.txt', import.meta.url)
const OUT = new URL('../src/data/squads.json', import.meta.url)

// Wikipedia → nombre que usa TheSportsDB (resto coinciden tal cual)
const NAME_MAP = {
  'United States': 'USA',
  'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
}

let text
if (existsSync(TXT)) {
  text = readFileSync(TXT, 'utf8')
} else {
  const res = await fetch(
    'https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&prop=wikitext&formatversion=2&format=json'
  )
  text = (await res.json()).parse.wikitext
  writeFileSync(TXT, text)
}

const wikiName = (raw) => {
  // [[Enlace|Texto]] -> Texto ; [[Texto]] -> Texto ; sin "(footballer...)"
  const m = raw.match(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/)
  const name = m ? m[1].trim() : raw.replace(/[[\]{}]/g, '').trim()
  return name.replace(/\s*\([^)]*\)\s*$/, '')
}

const param = (row, key) => {
  const m = row.match(new RegExp(`\\|${key}=((?:\\{\\{[^}]*\\}\\}|[^|}])*)`))
  return m ? m[1].trim() : ''
}

const sections = text.split(/^===(.+?)===$/m) // [_, titulo, cuerpo, titulo, cuerpo...]
const squads = {}

for (let i = 1; i < sections.length - 1; i += 2) {
  const title = sections[i].trim()
  const body = sections[i + 1]
  if (!body.includes('nat fs g player')) continue

  const coachMatch = body.match(/Coach:.*?\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/)
  const players = []
  for (const row of body.match(/\{\{nat fs g player\|[^\n]+/g) || []) {
    const ageTpl = param(row, 'age') // {{birth date and age2|2026|6|11|YYYY|M|D}}
    const birth = ageTpl.match(/\|(\d{4})\|(\d{1,2})\|(\d{1,2})\}*$/)
    let age = null
    if (birth) {
      const b = new Date(`${birth[1]}-${birth[2].padStart(2, '0')}-${birth[3].padStart(2, '0')}`)
      age = Math.floor((Date.UTC(2026, 5, 11) - b.getTime()) / (365.25 * 24 * 3600 * 1000))
    }
    players.push({
      no: Number(param(row, 'no')) || null,
      pos: param(row, 'pos'),
      name: wikiName(param(row, 'name')),
      age,
      caps: Number(param(row, 'caps')) || 0,
      goals: Number(param(row, 'goals')) || 0,
      club: wikiName(param(row, 'club')),
    })
  }
  if (players.length === 0) continue
  const key = NAME_MAP[title] || title
  squads[key] = { coach: coachMatch ? coachMatch[1].trim() : null, players }
}

writeFileSync(OUT, JSON.stringify(squads, null, 1))

const teams = Object.keys(squads)
console.log(`equipos: ${teams.length}`)
const bad = teams.filter((t) => squads[t].players.length < 23 || !squads[t].coach)
console.log(bad.length ? `revisar: ${bad.map((t) => `${t}(${squads[t].players.length}, coach:${squads[t].coach})`).join(', ')}` : 'todas las plantillas completas con técnico ✔')
console.log(teams.map((t) => `${t}: ${squads[t].players.length} jug · DT ${squads[t].coach}`).slice(0, 5).join('\n'))
