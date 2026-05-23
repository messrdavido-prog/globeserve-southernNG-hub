import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

const MEETING_TYPES = ['Monthly coordinators call', 'Quarterly hub meeting', 'Annual meeting', 'Special/Ad-hoc meeting']

export default function Meetings({ user }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', type: MEETING_TYPES[0], meeting_date: '', platform_venue: '', agenda: '', minutes: '', status: 'scheduled', attendees: '' })

  useEffect(() => { loadMeetings() }, [])

  const loadMeetings = async () => {
    setLoading(true)
    const { data } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: false })
    setMeetings(data || [])
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, created_by: user.id }
    if (editId) {
      await supabase.from('meetings').update(payload).eq('id', editId)
    } else {
      await supabase.from('meetings').insert(payload)
      await supabase.from('activity_log').insert({ action: `Meeting scheduled: ${form.title} on ${form.meeting_date}`, entity_type: 'meetings', performed_by: user.id })
    }
    setForm({ title: '', type: MEETING_TYPES[0], meeting_date: '', platform_venue: '', agenda: '', minutes: '', status: 'scheduled', attendees: '' })
    setShowForm(false); setEditId(null)
    loadMeetings(); setSaving(false)
  }

  const handleEdit = (m) => {
    setForm({ title: m.title, type: m.type, meeting_date: m.meeting_date, platform_venue: m.platform_venue || '', agenda: m.agenda || '', minutes: m.minutes || '', status: m.status, attendees: m.attendees || '' })
    setEditId(m.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const statusBadge = (s) => {
    if (s === 'completed') return <span className="badge badge-green">Completed</span>
    if (s === 'cancelled') return <span className="badge badge-red">Cancelled</span>
    return <span className="badge badge-blue">Scheduled</span>
  }

  const upcoming = meetings.filter(m => new Date(m.meeting_date) >= new Date() && m.status === 'scheduled')
  const past = meetings.filter(m => new Date(m.meeting_date) < new Date() || m.status !== 'scheduled')

  return (
    <div className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div className="page-title">Meetings</div>
          <div className="page-sub">Schedule and track all hub meetings — coordinator calls, quarterly sessions, annual gatherings</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title:'',type:MEETING_TYPES[0],meeting_date:'',platform_venue:'',agenda:'',minutes:'',status:'scheduled',attendees:'' }) }}>
          <Icons.Plus /> Schedule meeting
        </button>
      </div>

      {showForm && (
        <div className="modal-wrap">
          <div className="modal-box">
            <div className="modal-title"><Icons.Calendar /> {editId ? 'Edit meeting' : 'Schedule a meeting'}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meeting title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. April Coordinator Call" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Meeting type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform / venue</label>
                  <input value={form.platform_venue} onChange={e => setForm({...form, platform_venue: e.target.value})} placeholder="e.g. Zoom, Google Meet, or physical address" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Agenda items</label>
                <textarea value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} placeholder="1. Opening prayer&#10;2. Hub updates&#10;3. UPG progress review&#10;4. Financial update&#10;5. AOB" />
              </div>
              <div className="form-group">
                <label className="form-label">Attendees</label>
                <textarea value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} placeholder="List of people attending / expected..." style={{minHeight:60}} />
              </div>
              {editId && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Meeting status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              )}
              {editId && (
                <div className="form-group">
                  <label className="form-label">Minutes / notes from meeting</label>
                  <textarea value={form.minutes} onChange={e => setForm({...form, minutes: e.target.value})} placeholder="Record key decisions, action items, and discussion points..." />
                </div>
              )}
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update meeting' : 'Save meeting'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="empty"><Icons.Loader /><p>Loading meetings...</p></div> : (
        <>
          {upcoming.length > 0 && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title"><Icons.Calendar /> Upcoming meetings</div><span className="badge badge-blue">{upcoming.length}</span></div>
              {upcoming.map((m, i) => (
                <div key={i} className="data-row">
                  <div className="row-icon" style={{background:'var(--blue-light)',color:'var(--blue)'}}><Icons.Calendar /></div>
                  <div className="row-body">
                    <div className="row-title">{m.title}</div>
                    <div className="row-sub">{m.type} · {m.platform_venue || 'Venue TBD'}</div>
                    {m.agenda && <div style={{fontSize:11,color:'var(--text-3)',marginTop:2,whiteSpace:'pre-line'}}>{m.agenda.split('\n').slice(0,2).join(' · ')}{m.agenda.split('\n').length > 2 ? '...' : ''}</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <div className="row-right">{formatDate(m.meeting_date)}</div>
                    <button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11}} onClick={() => handleEdit(m)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title"><Icons.History /> Past meetings</div><span className="badge badge-gray">{past.length}</span></div>
              {past.map((m, i) => (
                <div key={i} className="data-row">
                  <div className="row-icon" style={{background:'var(--surface2)',color:'var(--text-3)'}}><Icons.Calendar /></div>
                  <div className="row-body">
                    <div className="row-title" style={{color:'var(--text-2)'}}>{m.title}</div>
                    <div className="row-sub">{m.type} · {m.platform_venue || '—'}</div>
                    {m.minutes && <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Minutes recorded</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <div className="row-right">{formatDate(m.meeting_date)}</div>
                    <div style={{display:'flex',gap:4}}>{statusBadge(m.status)}<button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11}} onClick={() => handleEdit(m)}>View</button></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meetings.length === 0 && (
            <div className="card"><div className="empty"><Icons.Calendar /><p>No meetings scheduled yet. Schedule your first coordinator call.</p></div></div>
          )}
        </>
      )}
    </div>
  )
}
