import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

const ENTITY_TYPES = ['Church', 'Missionary training school', 'Missionary sending entity', 'Mission mobilization entity']
const STATUS_OPTIONS = ['active', 'inactive', 'probationary']

export default function Members({ user }) {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: '', state_location: '', contact_person: '', contact_phone: '', contact_email: '', joined_date: '', notes: '' })

  useEffect(() => { loadEntities() }, [])

  const loadEntities = async () => {
    setLoading(true)
    const { data } = await supabase.from('member_entities').select('*').order('name')
    setEntities(data || [])
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.type) return
    setSaving(true)
    const { error } = await supabase.from('member_entities').insert({ ...form, status: 'active' })
    if (!error) {
      await supabase.from('activity_log').insert({ action: `Member entity added: ${form.name}`, entity_type: 'member_entities', performed_by: user.id })
      setForm({ name: '', type: '', state_location: '', contact_person: '', contact_phone: '', contact_email: '', joined_date: '', notes: '' })
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

  const groupByType = (list) => {
    return ENTITY_TYPES.map(t => ({ type: t, items: list.filter(e => e.type === t) })).filter(g => g.items.length > 0)
  }

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
                  <label className="form-label">State / location</label>
                  <input value={form.state_location} onChange={e => setForm({...form, state_location: e.target.value})} placeholder="e.g. Rivers State" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date joined</label>
                  <input type="date" value={form.joined_date} onChange={e => setForm({...form, joined_date: e.target.value})} />
                </div>
              </div>
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
              <div className="form-group">
                <label className="form-label">Notes</label>
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
            {group.items.map((e, i) => (
              <div key={i} className="data-row">
                <div className="row-icon" style={{background:typeColor(e.type).bg,color:typeColor(e.type).color}}><Icons.Building /></div>
                <div className="row-body">
                  <div className="row-title">{e.name}</div>
                  <div className="row-sub">
                    {[e.state_location, e.contact_person, e.contact_phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {statusBadge(e.status)}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
