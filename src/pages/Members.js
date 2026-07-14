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
const ACTIVITY_TYPES = ['Outreach / Evangelism', 'Training / Discipleship', 'Church planting', 'Prayer event', 'Fellowship / Meeting', 'Relief / Community project', 'Other']
const EMPTY_ACTIVITY = { title: '', activity_date: '', activity_type: ACTIVITY_TYPES[0], description: '', minutes_notes: '' }

export default function Members({ user }) {
  const [entities, setEntities] = useState([])
  const [upgsByEntity, setUpgsByEntity] = useState({})
  const [activitiesByEntity, setActivitiesByEntity] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activityEntityId, setActivityEntityId] = useState(null)
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY)
  const [activityPhotos, setActivityPhotos] = useState([])
  const [savingActivity, setSavingActivity] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => { loadEntities() }, [])

  const loadEntities = async () => {
    setLoading(true)
    const [entitiesRes, upgsRes, activitiesRes] = await Promise.all([
      supabase.from('member_entities').select('*').order('name'),
      supabase.from('upgs').select('id, name, engagement_stage, assigned_entity_id').not('assigned_entity_id', 'is', null),
      supabase.from('ministry_activities').select('*').order('activity_date', { ascending: false }),
    ])
    setEntities(entitiesRes.data || [])
    const grouped = {}
    ;(upgsRes.data || []).forEach(u => {
      if (!grouped[u.assigned_entity_id]) grouped[u.assigned_entity_id] = []
      grouped[u.assigned_entity_id].push(u)
    })
    setUpgsByEntity(grouped)
    const activityGroups = {}
    ;(activitiesRes.data || []).forEach(a => {
      if (!activityGroups[a.entity_id]) activityGroups[a.entity_id] = []
      activityGroups[a.entity_id].push(a)
    })
    setActivitiesByEntity(activityGroups)
    setLoading(false)
  }

  const openActivityForm = (entityId) => {
    setActivityEntityId(entityId)
    setActivityForm(EMPTY_ACTIVITY)
    setActivityPhotos([])
  }

  const closeActivityForm = () => {
    setActivityEntityId(null)
    setActivityForm(EMPTY_ACTIVITY)
    setActivityPhotos([])
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setActivityPhotos(prev => [...prev, ...files])
  }

  const removeSelectedPhoto = (index) => {
    setActivityPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveActivity = async (e) => {
    e.preventDefault()
    if (!activityForm.title || !activityEntityId) return
    setSavingActivity(true)
    setUploadProgress('')

    const photoUrls = []
    for (let i = 0; i < activityPhotos.length; i++) {
      const file = activityPhotos[i]
      setUploadProgress(`Uploading photo ${i + 1} of ${activityPhotos.length}...`)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${activityEntityId}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('ministry-photos').upload(path, file)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('ministry-photos').getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }
    }
    setUploadProgress('')

    const { error } = await supabase.from('ministry_activities').insert({
      entity_id: activityEntityId,
      title: activityForm.title,
      activity_date: activityForm.activity_date || null,
      activity_type: activityForm.activity_type,
      description: activityForm.description,
      minutes_notes: activityForm.minutes_notes,
      photo_urls: photoUrls,
      recorded_by: user.id,
    })
    if (!error) {
      const entityName = entities.find(e => e.id === activityEntityId)?.name || ''
      await supabase.from('activity_log').insert({ action: `Ministry activity logged for ${entityName}: ${activityForm.title}`, entity_type: 'ministry_activities', performed_by: user.id })
      closeActivityForm()
      loadEntities()
    }
    setSavingActivity(false)
  }

  const formatShortDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

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

                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,marginBottom:8}}>
                        <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Ministry activities & records</div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{padding:'4px 10px',fontSize:12}}
                          onClick={(ev) => { ev.stopPropagation(); openActivityForm(e.id) }}
                        >
                          <Icons.Plus /> Add activity
                        </button>
                      </div>

                      {(activitiesByEntity[e.id] || []).length === 0 ? (
                        <div style={{fontSize:13,color:'var(--text-3)'}}>No activities, photos, or minutes logged yet for this entity.</div>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:10}}>
                          {(activitiesByEntity[e.id] || []).map(a => (
                            <div key={a.id} style={{background:'var(--surface)',borderRadius:8,padding:'10px 12px'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:500}}>{a.title}</div>
                                  <div style={{fontSize:11,color:'var(--text-3)'}}>
                                    {[a.activity_type, formatShortDate(a.activity_date)].filter(Boolean).join(' · ')}
                                  </div>
                                </div>
                              </div>
                              {a.description && <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.5,marginBottom:6}}>{a.description}</div>}
                              {a.minutes_notes && (
                                <div className="inline-icon-row" style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text-2)',marginBottom:6}}>
                                  <Icons.File /> Minutes/notes recorded
                                </div>
                              )}
                              {a.photo_urls && a.photo_urls.length > 0 && (
                                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                  {a.photo_urls.map((url, pi) => (
                                    <a key={pi} href={url} target="_blank" rel="noreferrer">
                                      <img src={url} alt={`${a.title} photo ${pi + 1}`} style={{width:56,height:56,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      {activityEntityId && (
        <div className="modal-wrap" onClick={closeActivityForm}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-title"><Icons.Image /> Log ministry activity — {entities.find(e => e.id === activityEntityId)?.name}</div>
            <form onSubmit={handleSaveActivity}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Activity / programme title *</label>
                  <input value={activityForm.title} onChange={ev => setActivityForm({...activityForm, title: ev.target.value})} placeholder="e.g. Community outreach in Warri" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Activity type</label>
                  <select value={activityForm.activity_type} onChange={ev => setActivityForm({...activityForm, activity_type: ev.target.value})}>
                    {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" value={activityForm.activity_date} onChange={ev => setActivityForm({...activityForm, activity_date: ev.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={activityForm.description} onChange={ev => setActivityForm({...activityForm, description: ev.target.value})} placeholder="What happened, who was involved, outcomes..." />
              </div>
              <div className="form-group">
                <label className="form-label">Minutes / notes</label>
                <textarea value={activityForm.minutes_notes} onChange={ev => setActivityForm({...activityForm, minutes_notes: ev.target.value})} placeholder="Meeting minutes or detailed notes from this activity..." />
              </div>
              <div className="form-group">
                <label className="form-label">Photos</label>
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} />
                {activityPhotos.length > 0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                    {activityPhotos.map((f, i) => (
                      <div key={i} style={{position:'relative'}}>
                        <img src={URL.createObjectURL(f)} alt={f.name} style={{width:64,height:64,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)'}} />
                        <button
                          type="button"
                          onClick={() => removeSelectedPhoto(i)}
                          className="photo-remove-btn"
                          title="Remove photo"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {uploadProgress && <div style={{fontSize:12,color:'var(--text-2)',marginBottom:8}}>{uploadProgress}</div>}
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={savingActivity}>{savingActivity ? 'Saving...' : 'Save activity'}</button>
                <button type="button" className="btn btn-ghost" onClick={closeActivityForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
