import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

const ENTITY_TYPES = ['Church', 'Missionary training school', 'Missionary sending entity', 'Mission mobilization entity']
const STATUS_OPTIONS = ['active', 'inactive', 'probationary']
const FOCUS_AREAS = [
  'Evangelism / Outreach',
  'Discipleship & Training',
  'Church Planting',
  'Mission Mobilization',
  'UPG Engagement',
  'Prayer Ministry',
  'Media & Communication',
  'Relief & Development',
  'Other',
]
const EMPTY_FORM = { name: '', type: '', state_location: '', contact_person: '', contact_phone: '', contact_email: '', joined_date: '', focus_areas: [], notes: '' }

export default function Members({ user }) {
  const [entities, setEntities] = useState([])
  const [upgsByEntity, setUpgsByEntity] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { loadEntities() }, [])

  const loadEntities = async () => {
    setLoading(true)
    const [entitiesRes, upgsRes] = await Promise.all([
      supabase.from('member_entities').select('*').order('name'),
      supabase.from('upgs').select('id, name, engagement_stage, assigned_entity_id').not('assigned_entity_id', 'is', null),
    ])
    setEntities(entitiesRes.data || [])
    const grouped = {}
    ;(upgsRes.data || []).forEach(u => {
      if (!grouped[u.assigned_entity_id]) grouped[u.assigned_entity_id] = []
      grouped[u.assigned_entity_id].push(u)
    })
    setUpgsByEntity(grouped)
    setLoading(false)
  }

  const toggleFocusArea = (area) => {
    setForm(f => {
      const has = f.focus_areas.includes(area)
      return { ...f, focus_areas: has ? f.focus_areas.filter(a => a !== area) : [...f.focus_areas, area] }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.type) return
    setSaving(true)
    const { error } = await supabase.from('member_entities').insert({ ...form, status: 'active' })
    if (!error) {
      await supabase.from('activity_log').insert({ action: `Member entity added: ${form.name}`, entity_type: 'member_entities', performed_by: user.id })
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadEntities()
    }
    setSaving(false)
  }

  const typeColor = (type) => {
    if (type === 'Church') return { bg: 'var(--accent-light)', color: 'var(--accent)' }
    if (type?.includes('training')) return { bg: 'var(--blue-light)', color: 'var(--blue)' }
    if (type?.includes('sending')) return { bg: 'var(--amber-light)', color: 'var(--amber)' }
    return { bg: 'var(--surface2)', color: 'var(--text-2)' }
  }

  const statusBadge = (s) => {
    if (s === 'active') return <span className="badge badge-green">Active</span>
    if (s === 'probationary') return <span className="badge badge-amber">Probationary</span>
    return <span className="badge badge-gray">Inactive</span>
  }

  const stageBadge = (stage) => {
    if (!stage || stage === 'Unassigned') return <span className="badge badge-amber">Unassigned</span>
    if (stage.includes('1')) return <span className="badge badge-gray">Stage 1</span>
    if (stage.includes('2') || stage.includes('3')) return <span className="badge badge-blue">{stage.split(' - ')[0]}</span>
    return <span className="badge badge-green">{stage.split(' - ')[0]}</span>
  }

  const groupByType = (list) => {
    return ENTITY_TYPES.map(t => ({ type: t, items: list.filter(e => e.type === t) })).filter(g => g.items.length > 0)
  }

  const sectionHeaderStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '18px 0 8px' }

  return (
    <div className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div className="page-title">Member entities</div>
          <div className="page-sub">Churches, training schools, sending and mobilization entities · {entities.length} / 20 target</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Icons.Plus /> Add entity
        </button>
      </div>

      {showForm && (
        <div className="modal-wrap">
          <div className="modal-box">
            <div className="modal-title"><Icons.Building /> Add member entity</div>
            <form onSubmit={handleSave}>

              <div style={sectionHeaderStyle}>Basic info</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Entity name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Grace Mission Church" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Entity type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                    <option value="">Select type...</option>
                    {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location / Address</label>
                  <input value={form.state_location} onChange={e => setForm({...form, state_location: e.target.value})} placeholder="e.g. 12 Ahmadu Bello Way, Port Harcourt, Rivers State" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date joined</label>
                  <input type="date" value={form.joined_date} onChange={e => setForm({...form, joined_date: e.target.value})} />
                </div>
              </div>

              <div style={sectionHeaderStyle}>Contact</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact person</label>
                  <input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone number</label>
                  <input value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} placeholder="+234..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="contact@entity.org" />
              </div>

              <div style={sectionHeaderStyle}>Work focus</div>
              <div className="form-group">
                <label className="form-label">What does this organization mainly do? (tick all that apply)</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {FOCUS_AREAS.map(area => {
                    const active = form.focus_areas.includes(area)
                    return (
                      <button
                        type="button"
                        key={area}
                        onClick={() => toggleFocusArea(area)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 500,
                          border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: active ? 'var(--accent-light)' : 'var(--surface2)',
                          color: active ? 'var(--accent)' : 'var(--text-2)',
                          cursor: 'pointer',
                        }}
                      >
                        {active ? '✓ ' : ''}{area}
                      </button>
                    )
                  })}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:6}}>UPGs this organization is working with are set from the UPG tracker page — they'll show automatically on this profile.</div>
              </div>

              <div style={sectionHeaderStyle}>Notes</div>
              <div className="form-group">
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional information about this entity..." />
              </div>

              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save entity'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <span style={{fontSize:13,fontWeight:500}}>Membership target</span>
          <span style={{fontSize:13,color:'var(--text-2)'}}>{entities.length} of 20 entities</span>
        </div>
        <div className="progress-wrap"><div className="progress-bar" style={{width:`${Math.min((entities.length/20)*100, 100)}%`}}></div></div>
      </div>

      {loading ? (
        <div className="empty"><Icons.Loader /><p>Loading entities...</p></div>
      ) : entities.length === 0 ? (
        <div className="card"><div className="empty"><Icons.Building /><p>No member entities added yet. Click "Add entity" to get started.</p></div></div>
      ) : (
        groupByType(entities).map(group => (
          <div key={group.type} className="card" style={{marginBottom:16}}>
            <div className="card-header">
              <div className="card-title">
                <div className="row-icon" style={{width:24,height:24,borderRadius:6,...typeColor(group.type),background:typeColor(group.type).bg}}>
                  <Icons.Building />
                </div>
                {group.type}
              </div>
              <span className="badge badge-gray">{group.items.length}</span>
            </div>
            {group.items.map((e, i) => {
              const isOpen = expandedId === e.id
              const linkedUpgs = upgsByEntity[e.id] || []
              return (
                <div key={i}>
                  <div
                    className="data-row"
                    style={{cursor:'pointer'}}
                    onClick={() => setExpandedId(isOpen ? null : e.id)}
                  >
                    <div className="row-icon" style={{background:typeColor(e.type).bg,color:typeColor(e.type).color}}><Icons.Building /></div>
                    <div className="row-body">
                      <div className="row-title">{e.name}</div>
                      <div className="row-sub">
                        {[e.state_location, e.contact_person, e.contact_phone].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {statusBadge(e.status)}
                      <span style={{color:'var(--text-3)',display:'flex'}}>{isOpen ? <Icons.ArrowUp/> : <Icons.ArrowDown/>}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{background:'var(--surface2)',borderRadius:10,padding:'16px',margin:'0 0 12px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Location / Address</div>
                          <div style={{fontSize:13}}>{e.state_location || <span style={{color:'var(--text-3)'}}>Not provided</span>}</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Date joined</div>
                          <div style={{fontSize:13}}>{e.joined_date || <span style={{color:'var(--text-3)'}}>Not provided</span>}</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Contact person</div>
                          <div style={{fontSize:13}}>{e.contact_person || <span style={{color:'var(--text-3)'}}>Not provided</span>}</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Phone number</div>
                          <div style={{fontSize:13}}>{e.contact_phone || <span style={{color:'var(--text-3)'}}>Not provided</span>}</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Email address</div>
                          <div style={{fontSize:13}}>{e.contact_email || <span style={{color:'var(--text-3)'}}>Not provided</span>}</div>
                        </div>
                      </div>

                      <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Focus areas</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                        {(e.focus_areas && e.focus_areas.length > 0) ? e.focus_areas.map(a => (
                          <span key={a} className="badge badge-blue">{a}</span>
                        )) : <span style={{fontSize:13,color:'var(--text-3)'}}>Not provided</span>}
                      </div>

                      <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>UPGs working with</div>
                      {linkedUpgs.length > 0 ? (
                        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
                          {linkedUpgs.map(u => (
                            <div key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface)',borderRadius:8,padding:'6px 10px'}}>
                              <span style={{fontSize:13}}>{u.name}</span>
                              {stageBadge(u.engagement_stage)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{fontSize:13,color:'var(--text-3)',marginBottom:14}}>Not currently assigned to any people group</div>
                      )}

                      {e.notes && (
                        <>
                          <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Notes</div>
                          <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>{e.notes}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
