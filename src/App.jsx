import { useEffect, useMemo, useState } from 'react'
import { getGroupMatches, getKnockoutMatches, isLive } from './api.js'
import Fixture from './components/Fixture.jsx'
import Groups from './components/Groups.jsx'
import Bracket from './components/Bracket.jsx'
import Stats from './components/Stats.jsx'
import Squads from './components/Squads.jsx'
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
    setGroupMatches(matches)
    setLiveData(live)
    setUpdatedAt(new Date())
    try {
      setKoMatches(await getKnockoutMatches())
    } catch {
      /* las eliminatorias aún no existen en la API */
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Auto-actualiza cada 60 s si hay partidos en vivo, cada 5 min si no.
  const anyLive = useMemo(
    () => [...groupMatches, ...koMatches].some(isLive),
    [groupMatches, koMatches]
  )
  useEffect(() => {
    const id = setInterval(refresh, anyLive ? 60_000 : 300_000)
    return () => clearInterval(id)
  }, [anyLive])

  const allMatches = useMemo(() => [...groupMatches, ...koMatches], [groupMatches, koMatches])

  return (
    <div className="app">
      <header className="header">
        <div className="header-accent" />
        <div className="brand">
          <span className="brand-ball">⚽</span>
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
        {tab === 'squads' && <Squads matches={groupMatches} />}
        {tab === 'news' && <News />}
      </main>

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
