import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

const STAGES = [
  'Unassigned',
  'Stage 1 - Research/Prayer',
  'Stage 2 - Entry/Contact',
  'Stage 3 - Initial Disciples',
  'Stage 4 - Church Formation',
  'Stage 5 - Multiplication',
  'Stage 6 - Movement Emerging',
  'Stage 7 - Sustained Movement',
]

const DEFAULT_UPGS = [
  { name: 'Fulani people', location: 'Southern Nigeria / Middle Belt', language: 'Fula/Fulfulde', religion: 'Islam', population_estimate: '~2 million in region', engagement_stage: 'Unassigned' },
  { name: 'Kanuri people', location: 'Southern Nigeria / Borno area', language: 'Kanuri', religion: 'Islam', population_estimate: '~500,000 in region', engagement_stage: 'Unassigned' },
  { name: 'Bariba people', location: 'Southern Nigeria / Kwara/Kogi border', language: 'Bariba', religion: 'Islam / Traditional', population_estimate: '~300,000 in region', engagement_stage: 'Unassigned' },
]

export default function UPGTracker({ user }) {
  const [upgs, setUpgs] = useState([])
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', language: '', religion: '', population_estimate: '', engagement_stage: 'Unassigned', assigned_entity_id: '', prayer_points: '', research_notes: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [upgsRes, entitiesRes] = await Promise.all([
      supabase.from('upgs').select('*, member_entities(name)').order('created_at'),
      supabase.from('member_entities').select('id, name').eq('status', 'active').order('name'),
    ])
    if (!upgsRes.data || upgsRes.data.length === 0) {
      // Seed default UPGs
      const { data } = await supabase.from('upgs').insert(DEFAULT_UPGS).select()
      setUpgs(data || DEFAULT_UPGS)
    } else {
      setUpgs(upgsRes.data)
    }
    setEntities(entitiesRes.data || [])
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, assigned_entity_id: form.assigned_entity_id || null, last_updated: new Date().toISOString() }
    if (editId) {
      await supabase.from('upgs').update(payload).eq('id', editId)
      await supabase.from('activity_log').insert({ action: `UPG updated: ${form.name} — ${form.engagement_stage}`, entity_type: 'upgs', performed_by: user.id })
    } else {
      await supabase.from('upgs').insert(payload)
      await supabase.from('activity_log').insert({ action: `UPG added: ${form.name}`, entity_type: 'upgs', performed_by: user.id })
    }
    setForm({ name: '', location: '', language: '', religion: '', population_estimate: '', engagement_stage: 'Unassigned', assigned_entity_id: '', prayer_points: '', research_notes: '' })
    setShowForm(false); setEditId(null)
    loadData()
    setSaving(false)
  }

  const handleEdit = (upg) => {
    setForm({ name: upg.name, location: upg.location || '', language: upg.language || '', religion: upg.religion || '', population_estimate: upg.population_estimate || '', engagement_stage: upg.engagement_stage || 'Unassigned', assigned_entity_id: upg.assigned_entity_id || '', prayer_points: upg.prayer_points || '', research_notes: upg.research_notes || '' })
    setEditId(upg.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stageBadge = (stage) => {
    if (!stage || stage === 'Unassigned') return <span className="badge badge-amber">Unassigned</span>
    if (stage.includes('1')) return <span className="badge badge-gray">Stage 1</span>
    if (stage.includes('2') || stage.includes('3')) return <span className="badge badge-blue">{stage.split(' - ')[0]}</span>
    return <span className="badge badge-green">{stage.split(' - ')[0]}</span>
  }

  const stageNum = (stage) => parseInt(stage?.split(' ')[1]) || 0

  return (
    <div className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div className="page-title">UPG tracker</div>
          <div className="page-sub">Unreached people groups in the Southern Nigeria Hub's sphere of influence</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name:'',location:'',language:'',religion:'',population_estimate:'',engagement_stage:'Unassigned',assigned_entity_id:'',prayer_points:'',research_notes:'' }) }}>
          <Icons.Plus /> Add UPG
        </button>
      </div>

      {showForm && (
        <div className="modal-wrap">
          <div className="modal-box">
            <div className="modal-title"><Icons.Flag /> {editId ? 'Update people group' : 'Add people group'}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">People group name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Fulani people" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location / region</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Southern Nigeria / Delta State" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary language</label>
                  <input value={form.language} onChange={e => setForm({...form, language: e.target.value})} placeholder="e.g. Fula/Fulfulde" />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary religion</label>
                  <input value={form.religion} onChange={e => setForm({...form, religion: e.target.value})} placeholder="e.g. Islam" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Population estimate</label>
                  <input value={form.population_estimate} onChange={e => setForm({...form, population_estimate: e.target.value})} placeholder="e.g. ~2 million in region" />
                </div>
                <div className="form-group">
                  <label className="form-label">Engagement stage</label>
                  <select value={form.engagement_stage} onChange={e => setForm({...form, engagement_stage: e.target.value})}>
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned member entity</label>
                <select value={form.assigned_entity_id} onChange={e => setForm({...form, assigned_entity_id: e.target.value})}>
                  <option value="">Not yet assigned</option>
                  {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prayer points</label>
                <textarea value={form.prayer_points} onChange={e => setForm({...form, prayer_points: e.target.value})} placeholder="Key prayer requests for this people group..." />
              </div>
              <div className="form-group">
                <label className="form-label">Research notes</label>
                <textarea value={form.research_notes} onChange={e => setForm({...form, research_notes: e.target.value})} placeholder="Key facts, entry points, cultural notes..." />
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Save UPG'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty"><Icons.Loader /><p>Loading...</p></div>
      ) : (
        upgs.map((u, i) => (
          <div key={u.id || i} className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:500,marginBottom:2}}>{u.name}</div>
                <div style={{fontSize:12,color:'var(--text-2)'}}>{u.location}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {stageBadge(u.engagement_stage)}
                <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={() => handleEdit(u)}>Edit</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
              {u.language && <div style={{background:'var(--surface2)',borderRadius:8,padding:'8px 12px'}}><div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>Language</div><div style={{fontSize:13,fontWeight:500}}>{u.language}</div></div>}
              {u.religion && <div style={{background:'var(--surface2)',borderRadius:8,padding:'8px 12px'}}><div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>Religion</div><div style={{fontSize:13,fontWeight:500}}>{u.religion}</div></div>}
              {u.population_estimate && <div style={{background:'var(--surface2)',borderRadius:8,padding:'8px 12px'}}><div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>Population</div><div style={{fontSize:13,fontWeight:500}}>{u.population_estimate}</div></div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Assigned to</div>
                <div style={{fontSize:13}}>{u.member_entities?.name || <span style={{color:'var(--text-3)'}}>Not yet assigned</span>}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Engagement progress</div>
                <div className="progress-wrap"><div className="progress-bar" style={{width:`${(stageNum(u.engagement_stage)/7)*100}%`}}></div></div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>{stageNum(u.engagement_stage)} of 7 stages</div>
              </div>
            </div>
            {u.prayer_points && (
              <div style={{background:'var(--accent-light)',borderRadius:8,padding:'10px 12px',marginBottom:8}}>
                <div style={{fontSize:10,color:'var(--accent-text)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3,fontWeight:600}}>Prayer points</div>
                <div style={{fontSize:12,color:'var(--accent-text)',lineHeight:1.6}}>{u.prayer_points}</div>
              </div>
            )}
            {u.research_notes && (
              <div style={{background:'var(--surface2)',borderRadius:8,padding:'10px 12px'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3,fontWeight:600}}>Research notes</div>
                <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.6}}>{u.research_notes}</div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
