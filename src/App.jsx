import { useEffect, useMemo, useState } from 'react'
import {
  getGroupMatches,
  getKnockoutMatches,
  getLiveScores,
  mergeLiveScores,
  inLiveWindow,
  isLive,
} from './api.js'
import Fixture from './components/Fixture.jsx'
import Groups from './components/Groups.jsx'
import Bracket from './components/Bracket.jsx'
import Stats from './components/Stats.jsx'
import Squads from './components/Squads.jsx'
import UpdateToast from './components/UpdateToast.jsx'
import News from './components/News.jsx'

const TABS = [
  { key: 'fixture', label: 'Fixture', icon: '📅' },
  { key: 'groups', label: 'Grupos', icon: '🏟️' },
  { key: 'bracket', label: 'Llaves', icon: '🏆' },
  { key: 'stats', label: 'Stats', icon: '📊' },
  { key: 'squads', label: 'Equipos', icon: '👕' },
  { key: 'news', label: 'Noticias', icon: '📰' },
]

export default function App() {
  const [tab, setTab] = useState('fixture')
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  )

  useEffect(() => {
    if (dark) document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
    localStorage.setItem('m26:theme', dark ? 'dark' : 'light')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0d1424' : '#eef1f6')
  }, [dark])
  const [groupMatches, setGroupMatches] = useState([])
  const [koMatches, setKoMatches] = useState([])
  const [liveData, setLiveData] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  async function refresh() {
    const { matches, live } = await getGroupMatches()
    let merged = matches
    let liveScores = null
    // ventana amplia: los horarios de TheSportsDB a veces difieren de los reales
    if (inLiveWindow(matches, 8 * 3_600_000, 4 * 3_600_000)) {
      try {
        liveScores = await getLiveScores()
        merged = mergeLiveScores(matches, liveScores)
      } catch {
        /* sin marcador en vivo: se mantienen los datos base */
      }
    }
    setGroupMatches(merged)
    setLiveData(live)
    setUpdatedAt(new Date())
    try {
      let ko = await getKnockoutMatches()
      if (liveScores) ko = mergeLiveScores(ko, liveScores)
      setKoMatches(ko)
    } catch {
      /* las eliminatorias aún no existen en la API */
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Auto-actualiza cada 30 s en ventana de partido, cada 5 min si no.
  const anyLive = useMemo(
    () => [...groupMatches, ...koMatches].some(isLive),
    [groupMatches, koMatches]
  )
  const windowActive = anyLive || inLiveWindow(groupMatches) || inLiveWindow(koMatches)
  useEffect(() => {
    const id = setInterval(refresh, windowActive ? 30_000 : 300_000)
    return () => clearInterval(id)
  }, [windowActive])

  const allMatches = useMemo(() => [...groupMatches, ...koMatches], [groupMatches, koMatches])

  return (
    <div className="app">
      <header className="header">
        <div className="header-accent" />
        <div className="brand">
          <span className="brand-ball" aria-hidden="true">
            <img src="/icon.svg" alt="" className="brand-ball-icon" />
          </span>
          <div>
            <h1>FÚTBOL TRACKER <span className="brand-year">M26</span></h1>
            <p className="brand-sub">CAN · MEX · USA</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-status">
            {anyLive ? (
              <span className="live-dot">EN VIVO</span>
            ) : (
              <span className={`status-pill ${liveData ? 'online' : 'offline'}`}>
                <span className="status-dot" />
                {liveData ? 'En línea' : 'Offline'}
              </span>
            )}
            {updatedAt && (
              <span className="updated">
                {updatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button
            className="theme-btn"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'fixture' && <Fixture matches={allMatches} />}
        {tab === 'groups' && <Groups matches={groupMatches} />}
        {tab === 'bracket' && <Bracket matches={koMatches} groupMatches={groupMatches} />}
        {tab === 'stats' && <Stats matches={allMatches} />}
        {tab === 'squads' && <Squads />}
        {tab === 'news' && <News />}
      </main>

      <UpdateToast />

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
