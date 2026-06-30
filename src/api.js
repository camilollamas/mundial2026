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

async function fetchJSON(path, cacheKey, ttlMs, timeoutMs = 8000) {
  const cached = cacheKey ? cacheGet(cacheKey) : null
  if (cached) return cached
  const url = path.startsWith('http') ? path : `${BASE}/${path}`
  // un endpoint colgado no debe congelar la app: abortamos a los 8 s
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    if (cacheKey) cacheSet(cacheKey, data, ttlMs)
    return data
  } finally {
    clearTimeout(timer)
  }
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

// Último set bueno de partidos de grupo (persistente, sin caducar) para
// pintar la app al instante al abrir y como respaldo si la red falla.
const SNAP_KEY = 'groupsSnapshot'

export function cachedGroupMatches() {
  try {
    const raw = localStorage.getItem('m26:' + SNAP_KEY)
    if (raw) {
      const { data } = JSON.parse(raw)
      if (Array.isArray(data) && data.length) return data
    }
  } catch {
    /* sin localStorage */
  }
  return seedMatches.map((m) => ({ ...m, stage: null }))
}

// Fase de grupos: jornadas 1-3 (24 partidos cada una). Devuelve si los datos
// vinieron de la red (online) o de respaldo local.
export async function getGroupMatches() {
  try {
    const rounds = await Promise.all(
      [1, 2, 3].map((r) =>
        fetchJSON(`eventsround.php?id=${LEAGUE}&r=${r}&s=${SEASON}`, `round${r}`, 90_000)
      )
    )
    const events = rounds.flatMap((r) => r.events || [])
    if (events.length >= 72) {
      const matches = events.map(slimEvent)
      cacheSet(SNAP_KEY, matches, 365 * 24 * 3600 * 1000)
      return { matches, online: true }
    }
  } catch {
    /* sin conexión o API caída: usar el último snapshot o la semilla */
  }
  return { matches: cachedGroupMatches(), online: false }
}

// Eliminatorias: el plan gratuito de TheSportsDB no expone los rounds de
// eliminación (los marca como "r32" string y su endpoint solo acepta números),
// así que las traemos del scoreboard de ESPN para todo el rango de la fase
// final (28 jun – 19 jul), con marcador y estado en vivo incluidos.
export async function getKnockoutMatches() {
  const data = await fetchJSON(
    `${ESPN}/scoreboard?dates=20260628-20260719`,
    'koESPN',
    25_000
  )
  // ESPN lista los cruces futuros con placeholders ("Round of 32 X Winner");
  // solo mostramos los que ya tienen las dos selecciones definidas.
  const isPlaceholder = (n) => /winner|loser|round of|tbd|to be|runner/i.test(n || '')
  const seen = new Set()
  return (data.events || [])
    .map(espnEventToMatch)
    .filter(
      (m) =>
        m && m.stage && !isPlaceholder(m.home) && !isPlaceholder(m.away) &&
        !seen.has(m.id) && seen.add(m.id)
    )
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

// inverso: displayName de ESPN -> nuestro nombre interno (TheSportsDB)
const OURS_BY_ESPN = Object.fromEntries(
  Object.entries(ESPN_NAMES).map(([ours, espn]) => [normName(espn), ours])
)
const ourName = (espnDisplay) => OURS_BY_ESPN[normName(espnDisplay)] || espnDisplay

// estado de un evento de ESPN -> nuestro código de status + reloj
function espnState(e) {
  const st = e.status || {}
  const state = st.type?.state
  const name = st.type?.name || ''
  const period = st.period || 0
  if (state === 'pre') return { status: 'NS', clock: '' }
  if (state === 'post') {
    if (name.includes('PEN') || name.includes('SHOOTOUT')) return { status: 'PEN', clock: '' }
    if (name.includes('EXTRA') || name.includes('OVERTIME') || name.includes('AET'))
      return { status: 'AET', clock: '' }
    return { status: 'FT', clock: '' }
  }
  if (name.includes('HALFTIME')) return { status: 'HT', clock: '' }
  const status = period <= 1 ? '1H' : period === 2 ? '2H' : 'ET'
  return { status, clock: st.displayClock || '' }
}

// evento del scoreboard de ESPN -> nuestro formato de partido
function espnEventToMatch(e) {
  const c = e.competitions?.[0] || {}
  const comp = c.competitors || []
  const h = comp.find((x) => x.homeAway === 'home')
  const a = comp.find((x) => x.homeAway === 'away')
  if (!h || !a) return null
  const home = ourName(h.team?.displayName)
  const away = ourName(a.team?.displayName)
  const date = (e.date || '').slice(0, 10)
  const { status, clock } = espnState(e)
  const played = status !== 'NS'
  return {
    id: 'espn' + e.id,
    round: 0,
    home,
    away,
    homeId: null,
    awayId: null,
    hs: played && h.score != null ? Number(h.score) : null,
    as: played && a.score != null ? Number(a.score) : null,
    ts: (e.date || '').replace(/Z$/, ''),
    date,
    venue: c.venue?.fullName || '',
    country: c.venue?.address?.country || '',
    hb: null,
    ab: null,
    status,
    clock,
    stage: stageForDate(date),
  }
}

// Localiza el evento de ESPN correspondiente a un partido nuestro.
// ESPN agrupa el scoreboard por fecha del Este de EE. UU., así que un partido
// de las 02:00 UTC del día 12 vive en el scoreboard del día 11: probamos
// primero la fecha ET del kickoff y de respaldo la fecha UTC.
async function findEspnEvent(m) {
  const etDate = new Date(m.ts + 'Z')
    .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    .replaceAll('-', '')
  const utcDate = m.date.replaceAll('-', '')
  const dates = etDate === utcDate ? [etDate] : [etDate, utcDate]
  for (const date of dates) {
    const sb = await fetchJSON(`${ESPN}/scoreboard?dates=${date}`, `espnsb${date}`, 600_000)
    const ev = (sb.events || []).find((e) => {
      const names = (e.competitions?.[0]?.competitors || []).map((c) =>
        normName(c.team?.displayName)
      )
      return names.includes(espnName(m.home)) && names.includes(espnName(m.away))
    })
    if (ev) return ev
  }
  return null
}

// Resumen completo del partido en español, compartido por incidencias,
// stats y alineaciones. Solo vive en memoria (45 s): a localStorage van
// únicamente los derivados pequeños, para no reventar la cuota de ~5 MB
// con 104 summaries de ~200 KB.
const summaryCache = new Map()
async function fetchSummary(m) {
  const ev = await findEspnEvent(m)
  if (!ev) return null
  const key = ev.id
  if (!summaryCache.has(key)) {
    const p = fetch(`${ESPN}/summary?event=${ev.id}&lang=es&region=mx`)
      .then((r) => {
        if (!r.ok) throw new Error(`ESPN ${r.status}`)
        return r.json()
      })
      .catch((e) => {
        summaryCache.delete(key)
        throw e
      })
    summaryCache.set(key, p)
    setTimeout(() => summaryCache.delete(key), 45_000)
  }
  return summaryCache.get(key)
}

// migración: purgar los summaries completos cacheados por versiones previas
try {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('m26:espninc') || k.startsWith('m26:espnln')) localStorage.removeItem(k)
  }
} catch { /* sin localStorage */ }

// Estadísticas comparadas del partido (posesión, tiros, faltas...) del boxscore.
const STAT_KEYS = [
  ['possessionPct', 'Posesión %'],
  ['totalShots', 'Tiros'],
  ['shotsOnTarget', 'Tiros al arco'],
  ['wonCorners', 'Tiros de esquina'],
  ['foulsCommitted', 'Faltas'],
  ['offsides', 'Fueras de lugar'],
  ['saves', 'Atajadas'],
  ['yellowCards', 'Amarillas'],
  ['redCards', 'Rojas'],
]

export async function getMatchStats(m) {
  const ck = `mst${m.id}`
  const cached = cacheGet(ck)
  if (cached) return cached
  const sum = await fetchSummary(m)
  const teams = sum?.boxscore?.teams
  if (!teams || teams.length !== 2) return null
  // identificamos cada lado por homeAway (los nombres vienen traducidos)
  const bySide = {}
  for (const t of teams) {
    const stats = {}
    for (const s of t.statistics || []) stats[s.name] = s.displayValue
    bySide[t.homeAway] = stats
  }
  const h = bySide.home
  const a = bySide.away
  if (!h || !a) return null
  const rows = STAT_KEYS
    .filter(([k]) => h[k] !== undefined && a[k] !== undefined)
    .map(([k, label]) => ({ label, home: h[k], away: a[k] }))
  if (!rows.length) return null
  cacheSet(ck, rows, isFinished(m) ? 86_400_000 : 45_000)
  return rows
}

// Historial de enfrentamientos directos entre las dos selecciones (ESPN).
export async function getH2H(m) {
  const ck = `h2h${m.id}`
  const cached = cacheGet(ck)
  if (cached) return cached
  const sum = await fetchSummary(m)
  const g = sum?.headToHeadGames?.[0]
  if (!g || !(g.events || []).length) return null
  const teamId = String(g.team?.id)
  const teamName = g.team?.displayName
  const oppName = (e) => e.opponent?.displayName || e.opponent?.abbreviation || ''
  const rows = g.events.map((e) => {
    const teamIsHome = String(e.homeTeamId) === teamId
    return {
      year: (e.gameDate || '').slice(0, 4),
      date: e.gameDate,
      comp: e.leagueName || e.competitionName || '',
      home: teamIsHome ? teamName : oppName(e),
      away: teamIsHome ? oppName(e) : teamName,
      hs: e.homeTeamScore,
      as: e.awayTeamScore,
    }
  })
  // más reciente primero
  rows.sort((a, b) => (a.date < b.date ? 1 : -1))
  cacheSet(ck, rows, 30 * 24 * 3600 * 1000)
  return rows
}

// Incidencias completas del partido en español (goles, tarjetas, cambios,
// pausas, VAR, etc.) desde keyEvents de ESPN. null si no hay datos.
export async function getIncidents(m) {
  const ck = `inc${m.id}`
  const cached = cacheGet(ck)
  if (cached) return cached
  const sum = await fetchSummary(m)
  if (!sum) return null
  const raw = (sum.keyEvents || []).map((k) => ({
    min: k.clock?.displayValue || '',
    type: k.type?.text || '',
    text: k.text || '',
    team: k.team?.displayName || '',
    player: k.participants?.[0]?.athlete?.displayName || '',
    assist: k.participants?.[1]?.athlete?.displayName || '',
  }))
  // ESPN duplica algunos eventos (uno por equipo); nos quedamos con el que trae texto
  const seen = new Map()
  for (const it of raw) {
    const key = `${it.min}|${it.type}`
    if (!seen.has(key) || (it.text && !seen.get(key).text)) seen.set(key, it)
  }
  // más reciente primero
  const list = [...seen.values()].reverse()
  if (!list.length) return null
  cacheSet(ck, list, isFinished(m) ? 86_400_000 : 45_000)
  return list
}

// Devuelve { [equipo]: { formation, starters[], subs[] } } con las claves
// m.home / m.away, o null si ESPN aún no publica la alineación.
export async function getLineups(m) {
  const ck = `lu${m.id}`
  const cached = cacheGet(ck)
  if (cached) return cached
  const sum = await fetchSummary(m)
  if (!sum) return null

  const out = {}
  for (const side of sum.rosters || []) {
    // el summary en español traduce los nombres: cruzamos por homeAway
    const teamKey = side.homeAway === 'home' ? m.home : m.away
    if (!(side.roster || []).length) continue
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
  if (Object.keys(out).length !== 2) return null
  // ya anunciada la alineación es estable; antes del anuncio no se cachea
  cacheSet(ck, out, isFinished(m) ? 86_400_000 : 600_000)
  return out
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
