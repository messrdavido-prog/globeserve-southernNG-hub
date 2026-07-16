import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Icons } from './components/Icons'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import UPGTracker from './pages/UPGTracker'
import Meetings from './pages/Meetings'
import NeedsAssessment from './pages/NeedsAssessment'
import { Documents, Finances, Objectives, StageProgress, SubmitReport } from './pages/OtherPages'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', group: 'Overview' },
  { id: 'members', label: 'Member entities', icon: 'Users', group: 'Overview' },
  { id: 'upgs', label: 'UPG tracker', icon: 'Flag', group: 'Overview' },
  { id: 'meetings', label: 'Meetings', icon: 'Calendar', group: 'Operations' },
  { id: 'needs', label: 'Needs assessment', icon: 'Speakerphone', group: 'Operations' },
  { id: 'docs', label: 'Minutes & docs', icon: 'File', group: 'Operations' },
  { id: 'finances', label: 'Finances', icon: 'Cash', group: 'Operations' },
  { id: 'objectives', label: 'Objectives', icon: 'Target', group: 'Hub' },
  { id: 'stage', label: 'Stage progress', icon: 'Chart', group: 'Hub' },
  { id: 'report', label: 'Submit report', icon: 'Send', group: 'Hub' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPage('dashboard')
  }

  const navigate = (p) => { setPage(p); setMenuOpen(false) }

  const groups = [...new Set(NAV.map(n => n.group))]

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:4}}>GlobeServe</div>
        <div style={{fontSize:13,color:'var(--text-2)',marginBottom:8}}>Southern Nigeria Hub · Management Portal</div>
        <div style={{fontSize:13,color:'var(--text-2)'}}>Loading...</div>
      </div>
    </div>
  )

  if (!session) return <AuthPage />

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'HM'

  const renderPage = () => {
    const props = { user: session.user, profile, navigate }
    switch (page) {
      case 'dashboard': return <Dashboard {...props} />
      case 'members': return <Members {...props} />
      case 'upgs': return <UPGTracker {...props} />
      case 'meetings': return <Meetings {...props} />
      case 'needs': return <NeedsAssessment {...props} />
      case 'docs': return <Documents {...props} />
      case 'finances': return <Finances {...props} />
      case 'objectives': return <Objectives />
      case 'stage': return <StageProgress {...props} />
      case 'report': return <SubmitReport {...props} />
      default: return <Dashboard {...props} />
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <button className="menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Open menu">
            {menuOpen ? <Icons.X /> : <Icons.Menu />}
          </button>
          <Icons.Globe />
          <span className="topbar-logo">GlobeServe</span>
          <div className="topbar-divider" />
          <span className="topbar-hub">Southern Nigeria Hub<span className="topbar-portal-suffix"> · Management Portal</span></span>
        </div>
        <div className="topbar-right">
          <span className="topbar-stage">Stage 2 — Pioneering</span>
          {profile?.full_name && <span style={{fontSize:13,color:'rgba(255,255,255,0.7)',display:'none'}} className="desktop-only">{profile.full_name}</span>}
          <div className="topbar-avatar" title="Sign out" onClick={handleSignOut}>{initials}</div>
        </div>
      </header>

      <div className="main-layout">
        {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
        <nav className={`sidebar${menuOpen ? ' open' : ''}`}>
          {groups.map(group => (
            <div key={group} className="nav-group">
              <div className="nav-group-label">{group}</div>
              {NAV.filter(n => n.group === group).map(item => {
                const IconComp = Icons[item.icon]
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                  >
                    <IconComp />
                    {item.label}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="nav-group" style={{marginTop:'auto'}}>
            <div className="nav-item" onClick={handleSignOut} style={{color:'var(--red)'}}>
              <Icons.LogOut />
              Sign out
            </div>
          </div>
        </nav>

        <main style={{flex:1,overflow:'auto'}}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
