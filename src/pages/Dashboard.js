import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

export default function Dashboard({ user, profile, navigate }) {
  const [stats, setStats] = useState({ members: 0, upgs: 3, meetings: 0, docs: 0 })
  const [recentUpgs, setRecentUpgs] = useState([])
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkedItems, setCheckedItems] = useState(0)
  const [totalItems, setTotalItems] = useState(6)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    const [members, upgs, meetings, docs, checklist, activityLog] = await Promise.all([
      supabase.from('member_entities').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('upgs').select('id, name, location, engagement_stage').order('created_at', { ascending: false }).limit(4),
      supabase.from('meetings').select('*').gte('meeting_date', new Date().toISOString().split('T')[0]).order('meeting_date').limit(3),
      supabase.from('documents').select('id', { count: 'exact' }),
      supabase.from('stage_checklist').select('is_completed').eq('stage_number', 2),
      supabase.from('activity_log').select('action, created_at').order('created_at', { ascending: false }).limit(6),
    ])
    setStats({
      members: members.count || 0,
      upgs: upgs.data?.length || 3,
      meetings: meetings.data?.length || 0,
      docs: docs.count || 0,
    })
    setRecentUpgs(upgs.data || [])
    setUpcomingMeetings(meetings.data || [])
    setActivity(activityLog.data || [])
    const items = checklist.data || []
    setCheckedItems(items.filter(i => i.is_completed).length)
    setTotalItems(items.length || 6)
    setLoading(false)
  }

  const stageBadge = (stage) => {
    if (!stage || stage === 'Unassigned') return <span className="badge badge-amber">Unassigned</span>
    if (stage.includes('1')) return <span className="badge badge-gray">Stage 1</span>
    if (stage.includes('2')) return <span className="badge badge-blue">Stage 2</span>
    return <span className="badge badge-green">{stage.split(' - ')[0]}</span>
  }

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts)
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const stageProgress = Math.round((checkedItems / totalItems) * 100)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">
          GlobeServe Southern Nigeria Hub · Stage 2 — Pioneering
          {profile?.full_name && ` · Welcome, ${profile.full_name}`}
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Member entities</div>
          <div className="metric-value">{loading ? '—' : stats.members}</div>
          <div className="metric-note">Target: 20 entities</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">UPGs tracked</div>
          <div className="metric-value">3</div>
          <div className="metric-note">Fulanis · Kanuris · Bariba</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Hub stage</div>
          <div className="metric-value">2 / 5</div>
          <div className="metric-note">Pioneering phase</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Stage 2 progress</div>
          <div className="metric-value">{stageProgress}%</div>
          <div className="metric-note">{checkedItems} of {totalItems} criteria</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Icons.Flag /> UPG snapshot</div>
            <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={() => navigate('upgs')}>
              View all <Icons.ArrowRight />
            </button>
          </div>
          {recentUpgs.length === 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {[{name:'Fulani people',loc:'Southern Nigeria'},{name:'Kanuri people',loc:'Southern Nigeria'},{name:'Bariba people',loc:'Southern Nigeria'}].map((u,i) => (
                <div key={i} className="data-row">
                  <div className="row-icon" style={{background:'var(--amber-light)'}}><Icons.Flag /></div>
                  <div className="row-body"><div className="row-title">{u.name}</div><div className="row-sub">{u.loc}</div></div>
                  <span className="badge badge-amber">Unassigned</span>
                </div>
              ))}
            </div>
          ) : (
            recentUpgs.map((u, i) => (
              <div key={i} className="data-row">
                <div className="row-icon" style={{background:'var(--amber-light)'}}><Icons.Flag /></div>
                <div className="row-body"><div className="row-title">{u.name}</div><div className="row-sub">{u.location || 'Southern Nigeria'}</div></div>
                {stageBadge(u.engagement_stage)}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><Icons.Calendar /> Upcoming meetings</div>
            <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={() => navigate('meetings')}>
              Schedule <Icons.Plus />
            </button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="empty">
              <Icons.Calendar />
              <p>No meetings scheduled yet</p>
            </div>
          ) : (
            upcomingMeetings.map((m, i) => (
              <div key={i} className="data-row">
                <div className="row-icon" style={{background:'var(--blue-light)'}}><Icons.Calendar /></div>
                <div className="row-body">
                  <div className="row-title">{m.title}</div>
                  <div className="row-sub">{m.platform_venue || 'Venue TBD'}</div>
                </div>
                <div className="row-right">{formatDate(m.meeting_date)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <div className="card-title"><Icons.Chart /> Stage 2 — Pioneering progress</div>
          <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={() => navigate('stage')}>
            See checklist <Icons.ArrowRight />
          </button>
        </div>
        <div className="stage-track">
          <div className="stage-step done"></div>
          <div className="stage-step active"></div>
          <div className="stage-step"></div>
          <div className="stage-step"></div>
          <div className="stage-step"></div>
        </div>
        <div className="stage-labels">
          <span>1 · Envisioning</span>
          <span style={{color:'#2563eb',fontWeight:500}}>2 · Pioneering ←</span>
          <span>3 · Maturing</span>
          <span>4 · Advancing</span>
          <span>5 · Expanding</span>
        </div>
        <div style={{marginTop:10}}>
          <div className="progress-wrap"><div className="progress-bar" style={{width:`${stageProgress}%`}}></div></div>
          <div style={{fontSize:12,color:'var(--text-2)',marginTop:5}}>{stageProgress}% complete — {totalItems - checkedItems} criteria remaining for Stage 2</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Icons.History /> Recent activity</div>
        </div>
        {activity.length === 0 ? (
          <div className="empty"><Icons.History /><p>Activity will appear here as you use the app</p></div>
        ) : (
          activity.map((a, i) => (
            <div key={i} className="data-row">
              <div className="row-icon" style={{background:'var(--accent-light)'}}><Icons.Info /></div>
              <div className="row-body"><div className="row-title">{a.action}</div></div>
              <div className="row-right">{timeAgo(a.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
