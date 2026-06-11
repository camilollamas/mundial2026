import seedMatches from './data/seed-matches.json'
import { stageForDate } from './data/groups.js'

const BASE = 'https://www.thesportsdb.com/api/v1/json/123'
const LEAGUE = 4429
const SEASON = 2026

// --- caché ligera en localStorage con TTL ---
function cacheGet(key) {
  try {
    const raw = localStorage.getItem('m26:' + key)
    if (!raw) return null
    const { exp, data } = JSON.parse(raw)
    return Date.now() < exp ? data : null
  } catch {
    return null
  }
}

function cacheSet(key, data, ttlMs) {
  try {
    localStorage.setItem('m26:' + key, JSON.stringify({ exp: Date.now() + ttlMs, data }))
  } catch {
    /* almacenamiento lleno: seguimos sin caché */
  }
}

async function fetchJSON(path, cacheKey, ttlMs) {
  const cached = cacheKey ? cacheGet(cacheKey) : null
  if (cached) return cached
  const url = path.startsWith('http') ? path : `${BASE}/${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  if (cacheKey) cacheSet(cacheKey, data, ttlMs)
  return data
}

const slimEvent = (e) => ({
  id: e.idEvent,
  round: parseInt(e.intRound, 10) || 0,
  home: e.strHomeTeam,
  away: e.strAwayTeam,
  homeId: e.idHomeTeam,
  awayId: e.idAwayTeam,
  hs: e.intHomeScore === null || e.intHomeScore === undefined ? null : Number(e.intHomeScore),
  as: e.intAwayScore === null || e.intAwayScore === undefined ? null : Number(e.intAwayScore),
  ts: e.strTimestamp,
  date: e.dateEvent,
  venue: e.strVenue,
  country: e.strCountry,
  hb: e.strHomeTeamBadge,
  ab: e.strAwayTeamBadge,
  status: e.strStatus,
  stage: stageForDate(e.dateEvent),
})

// Fase de grupos: jornadas 1-3 (24 partidos cada una). Semilla local como respaldo.
export async function getGroupMatches() {
  try {
    const rounds = await Promise.all(
      [1, 2, 3].map((r) =>
        fetchJSON(`eventsround.php?id=${LEAGUE}&r=${r}&s=${SEASON}`, `round${r}`, 90_000)
      )
    )
    const events = rounds.flatMap((r) => r.events || [])
    if (events.length >= 72) return { matches: events.map(slimEvent), live: true }
  } catch {
    /* sin conexión o API caída: usar semilla */
  }
  return { matches: seedMatches.map((m) => ({ ...m, stage: null })), live: false }
}

// Eliminatorias: TheSportsDB crea los eventos cuando se conocen los cruces.
// Sondeamos los números de ronda que usa para copas y clasificamos por fecha.
const KO_ROUND_IDS = [4, 5, 6, 7, 116, 125, 150, 160, 200]

export async function getKnockoutMatches() {
  const results = await Promise.allSettled(
    KO_ROUND_IDS.map((r) =>
      fetchJSON(`eventsround.php?id=${LEAGUE}&r=${r}&s=${SEASON}`, `ko${r}`, 300_000)
    )
  )
  const events = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value.events || [])
  const seen = new Set()
  return events
    .map(slimEvent)
    .filter((m) => m.stage && !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => (a.ts < b.ts ? -1 : 1))
}

// Cronología de un partido: goles, tarjetas y cambios (límite free: ~5 ítems).
export async function getTimeline(eventId) {
  const data = await fetchJSON(`lookuptimeline.php?id=${eventId}`, `tl${eventId}`, 3_600_000)
  return data.timeline || []
}

// --- Alineaciones oficiales por partido (API pública de ESPN) ---
// TheSportsDB no las da en el plan gratuito; ESPN las publica ~1 h antes
// del pitazo en summary.rosters (titulares, formación y suplentes).
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// nuestro nombre (TheSportsDB) -> displayName de ESPN, solo los que difieren
const ESPN_NAMES = {
  'Czech Republic': 'Czechia',
  'DR Congo': 'Congo DR',
  Turkey: 'Türkiye',
  USA: 'United States',
}

const normName = (s) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const espnName = (team) => normName(ESPN_NAMES[team] || team)

// Devuelve { [equipo]: { formation, starters[], subs[] } } con las claves
// m.home / m.away, o null si ESPN aún no publica la alineación.
export async function getLineups(m) {
  const date = m.date.replaceAll('-', '')
  const sb = await fetchJSON(`${ESPN}/scoreboard?dates=${date}`, `espnsb${date}`, 600_000)
  const ev = (sb.events || []).find((e) => {
    const names = (e.competitions?.[0]?.competitors || []).map((c) =>
      normName(c.team?.displayName)
    )
    return names.includes(espnName(m.home)) && names.includes(espnName(m.away))
  })
  if (!ev) return null

  // sin caché previa: revisamos frescura según si ya hay titulares
  const cacheKey = `espnln${ev.id}`
  let sum = cacheGet(cacheKey)
  if (!sum) {
    const res = await fetch(`${ESPN}/summary?event=${ev.id}`)
    if (!res.ok) throw new Error(`ESPN ${res.status}`)
    sum = await res.json()
    const announced = (sum.rosters || []).some((r) => (r.roster || []).length > 0)
    cacheSet(cacheKey, sum, announced ? 3_600_000 : 120_000)
  }

  const out = {}
  for (const side of sum.rosters || []) {
    const teamKey = [m.home, m.away].find(
      (t) => espnName(t) === normName(side.team?.displayName)
    )
    if (!teamKey || !(side.roster || []).length) continue
    const players = side.roster.map((it) => ({
      name: it.athlete?.displayName || '',
      jersey: it.jersey || '',
      pos: it.position?.abbreviation || it.position?.name || '',
      starter: !!it.starter,
      place: Number(it.formationPlace) || 99,
      subbedIn: !!it.subbedIn,
    }))
    out[teamKey] = {
      formation: side.formation || '',
      starters: players.filter((p) => p.starter).sort((a, b) => a.place - b.place),
      subs: players.filter((p) => !p.starter),
    }
  }
  return Object.keys(out).length === 2 ? out : null
}

// Noticias del Mundial en español (ESPN Deportes), caché de 10 minutos.
export async function getNews() {
  const data = await fetchJSON(
    `${ESPN}/news?lang=es&region=mx&limit=20`,
    'espnnews',
    600_000
  )
  return (data.articles || []).map((a) => ({
    id: a.id,
    headline: a.headline,
    description: a.description || '',
    published: a.published,
    image: a.images?.[0]?.url || null,
    link: a.links?.web?.href || null,
  }))
}

// Cuerpo completo de una nota (HTML) para leerla dentro de la app.
export async function getArticle(id) {
  const data = await fetchJSON(
    `https://content.core.api.espn.com/v1/sports/news/${id}?lang=es&region=mx`,
    `art${id}`,
    86_400_000
  )
  const a = data.headlines?.[0] || data
  return {
    headline: a.headline,
    byline: a.byline || '',
    published: a.published,
    story: a.story || '',
  }
}

// --- Marcador en vivo con minuto de juego (scoreboard de ESPN) ---
// TheSportsDB free actualiza lento y sin reloj; ESPN trae displayClock
// (ej. "67'") y marcador al instante. Se consulta solo en ventana de partido.

// ESPN agrupa el scoreboard por fecha del Este de EE. UU.
const espnToday = () =>
  new Date()
    .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    .replaceAll('-', '')

export async function getLiveScores() {
  const sb = await fetchJSON(`${ESPN}/scoreboard?dates=${espnToday()}`, `espnlive`, 25_000)
  return (sb.events || []).map((e) => {
    const comp = e.competitions?.[0] || {}
    const side = (ha) => (comp.competitors || []).find((c) => c.homeAway === ha)
    const home = side('home')
    const away = side('away')
    return {
      home: normName(home?.team?.displayName),
      away: normName(away?.team?.displayName),
      hs: home?.score != null ? Number(home.score) : null,
      as: away?.score != null ? Number(away.score) : null,
      state: e.status?.type?.state, // pre | in | post
      name: e.status?.type?.name || '',
      clock: e.status?.displayClock || '',
      period: e.status?.period || 0,
    }
  })
}

// Sobrepone marcador/minuto de ESPN a los partidos de TheSportsDB.
export function mergeLiveScores(matches, live) {
  if (!live?.length) return matches
  const map = new Map(live.map((l) => [`${l.home}|${l.away}`, l]))
  return matches.map((m) => {
    const l = map.get(`${espnName(m.home)}|${espnName(m.away)}`)
    if (!l || l.state === 'pre' || l.hs === null) return m
    if (l.state === 'post') {
      return { ...m, hs: l.hs, as: l.as, status: 'FT', clock: '' }
    }
    const status = l.name === 'STATUS_HALFTIME' ? 'HT' : l.period <= 1 ? '1H' : l.period === 2 ? '2H' : 'ET'
    return { ...m, hs: l.hs, as: l.as, status, clock: status === 'HT' ? '' : l.clock }
  })
}

// ¿Hay algún partido en ventana de juego? Por defecto 10 min antes → 3 h
// después; se puede ampliar (los horarios de la fuente base a veces difieren).
export const inLiveWindow = (matches, pre = 10 * 60_000, post = 3 * 3_600_000) => {
  const now = Date.now()
  return matches.some((m) => {
    const t = new Date(m.ts + 'Z').getTime()
    return now > t - pre && now < t + post
  })
}

export const isFinished = (m) => m.status === 'FT' || m.status === 'AET' || m.status === 'PEN'
export const isLive = (m) =>
  ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(m.status)
