import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

// ─── DOCUMENTS ───────────────────────────────────────────────
export function Documents({ user }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'Meeting minutes', doc_date: '', summary: '', content: '' })

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('documents').insert({ ...form, uploaded_by: user.id })
    await supabase.from('activity_log').insert({ action: `Document logged: ${form.title}`, entity_type: 'documents', performed_by: user.id })
    setForm({ title: '', type: 'Meeting minutes', doc_date: '', summary: '', content: '' })
    setShowForm(false); loadDocs(); setSaving(false)
  }

  const typeIcon = (type) => {
    if (type?.includes('Minutes')) return { bg: 'var(--blue-light)', color: 'var(--blue)' }
    if (type?.includes('Financial')) return { bg: 'var(--amber-light)', color: 'var(--amber)' }
    if (type?.includes('UPG')) return { bg: 'var(--accent-light)', color: 'var(--accent)' }
    return { bg: 'var(--surface2)', color: 'var(--text-2)' }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><div className="page-title">Minutes & documents</div><div className="page-sub">Meeting minutes, reports, UPG research, and key hub documents</div></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Icons.Plus /> Log document</button>
      </div>

      {showForm && (
        <div className="modal-wrap">
          <div className="modal-box">
            <div className="modal-title"><Icons.File /> Log a document</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Document title *</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Minutes — April 2025 Hub Meeting" required /></div>
                <div className="form-group"><label className="form-label">Document type</label>
                  <select value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                    {['Meeting minutes','Progress report','UPG research report','Financial report','Other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Date</label><input type="date" value={form.doc_date} onChange={e => setForm({...form,doc_date:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Summary / key points</label><textarea value={form.summary} onChange={e => setForm({...form,summary:e.target.value})} placeholder="Brief summary of the document content..." /></div>
              <div className="form-group"><label className="form-label">Full content (optional)</label><textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Paste full document content here if needed..." style={{minHeight:120}} /></div>
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save document'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="empty"><Icons.Loader /></div> : docs.length === 0 ? (
        <div className="card"><div className="empty"><Icons.File /><p>No documents logged yet.</p></div></div>
      ) : (
        <div className="card">
          {docs.map((d,i) => (
            <div key={i} className="data-row">
              <div className="row-icon" style={typeIcon(d.type)}><Icons.File /></div>
              <div className="row-body">
                <div className="row-title">{d.title}</div>
                <div className="row-sub">{d.type}{d.doc_date ? ' · ' + formatDate(d.doc_date) : ''}</div>
                {d.summary && <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{d.summary.substring(0,80)}{d.summary.length>80?'...':''}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FINANCES ────────────────────────────────────────────────
export function Finances({ user }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'income', description: '', amount: '', transaction_date: '', category: '' })

  useEffect(() => { loadFinances() }, [])

  const loadFinances = async () => {
    setLoading(true)
    const { data } = await supabase.from('finances').select('*').order('transaction_date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('finances').insert({ ...form, amount: parseFloat(form.amount), recorded_by: user.id })
    await supabase.from('activity_log').insert({ action: `Finance recorded: ${form.type === 'income' ? 'Income' : 'Expense'} — ${form.description} (₦${form.amount})`, entity_type: 'finances', performed_by: user.id })
    setForm({ type: 'income', description: '', amount: '', transaction_date: '', category: '' })
    setShowForm(false); loadFinances(); setSaving(false)
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  const fmt = (n) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 })
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><div className="page-title">Finances</div><div className="page-sub">Hub income and expenditure tracker · GlobeServe does not fund hubs directly</div></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Icons.Plus /> Add transaction</button>
      </div>

      <div className="metric-grid" style={{marginBottom:16}}>
        <div className="metric-card"><div className="metric-label">Total income</div><div className="metric-value fin-positive" style={{fontSize:18}}>{fmt(totalIncome)}</div></div>
        <div className="metric-card"><div className="metric-label">Total expenses</div><div className="metric-value fin-negative" style={{fontSize:18}}>{fmt(totalExpense)}</div></div>
        <div className="metric-card"><div className="metric-label">Balance</div><div className="metric-value" style={{fontSize:18,color:balance>=0?'var(--accent)':'var(--red)'}}>{fmt(balance)}</div></div>
      </div>

      {showForm && (
        <div className="modal-wrap">
          <div className="modal-box">
            <div className="modal-title"><Icons.Cash /> Record transaction</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label>
                  <select value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Amount (₦) *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="0.00" required /></div>
              </div>
              <div className="form-group"><label className="form-label">Description *</label><input value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="e.g. Member contributions — May 2025" required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date</label><input type="date" value={form.transaction_date} onChange={e => setForm({...form,transaction_date:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Category</label><input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="e.g. Contributions, Event, Training..." /></div>
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save transaction'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="empty"><Icons.Loader /></div> : transactions.length === 0 ? (
        <div className="card"><div className="empty"><Icons.Cash /><p>No transactions recorded yet.</p></div></div>
      ) : (
        <div className="card">
          {transactions.map((t,i) => (
            <div key={i} className="data-row">
              <div className="row-icon" style={{background:t.type==='income'?'var(--accent-light)':'var(--red-light)',color:t.type==='income'?'var(--accent)':'var(--red)'}}>
                {t.type==='income'?<Icons.ArrowUp />:<Icons.ArrowDown />}
              </div>
              <div className="row-body">
                <div className="row-title">{t.description}</div>
                <div className="row-sub">{t.category ? t.category + ' · ' : ''}{formatDate(t.transaction_date)}</div>
              </div>
              <div className="row-right" style={{fontWeight:500,color:t.type==='income'?'var(--accent)':'var(--red)'}}>{fmt(Number(t.amount))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── OBJECTIVES ──────────────────────────────────────────────
export function Objectives() {
  const objectives = [
    { icon: <Icons.Users />, title: 'Partnership & network building', desc: 'Recruit member churches, training schools, and sending entities across Southern Nigeria into the hub network. Target: 20 entities.' },
    { icon: <Icons.Speakerphone />, title: 'Mobilization', desc: 'Host vision events to grow missionary awareness among Southern Nigerian churches toward Fulanis, Kanuris, and Bariba peoples.' },
    { icon: <Icons.Flag />, title: 'UPG research — 3 target groups', desc: 'Research and document the Fulani, Kanuri, and Bariba peoples. Facilitate prayer, adoption by member entities, and stage-by-stage engagement.' },
    { icon: <Icons.School />, title: 'Missionary training program', desc: 'Initiate at least one missionary training program in Southern Nigeria during the pioneering phase.' },
    { icon: <Icons.Send />, title: 'Sending structures', desc: 'Begin conversations with denominations and churches about developing missionary sending structures to send and support trained missionaries.' },
    { icon: <Icons.Heart />, title: 'Encouragement & fellowship', desc: 'Build a strong relational culture among hub members through regular meetings, shared prayer, and mutual accountability.' },
    { icon: <Icons.Coin />, title: 'Financial self-sustainability', desc: 'Establish a hub contribution structure and operate without dependency on external GlobeServe funding.' },
  ]
  const fivePoints = [
    'Commitment to making disciples and planting churches into exponential movements among least-reached peoples',
    "Commitment to GlobeServe's training philosophy — what missionaries should Know, Be, and Do",
    'Commitment to trust the Lord by faith for resources',
    'Commitment to sustainability as independent entities and as a hub in partnership',
    'Commitment to interdependent participation — giving and serving as well as receiving',
  ]
  return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Hub objectives</div><div className="page-sub">Southern Nigeria Hub commitments — Stage 2 Pioneering focus</div></div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-header"><div className="card-title"><Icons.Target /> Stage 2 priorities (pioneering phase)</div></div>
        <ul className="obj-list">
          {objectives.map((o,i)=>(
            <li key={i} className="obj-item">
              <div className="obj-icon">{o.icon}</div>
              <div><div className="obj-title">{o.title}</div><div className="obj-desc">{o.desc}</div></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title"><Icons.Check /> GlobeServe five points of agreement</div></div>
        <ul className="obj-list">
          {fivePoints.map((p,i)=>(
            <li key={i} className="obj-item">
              <div className="obj-icon" style={{background:'var(--accent-light)'}}><Icons.Check /></div>
              <div><div className="obj-desc" style={{color:'var(--text)'}}>{p}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── STAGE PROGRESS ──────────────────────────────────────────
export function StageProgress({ user }) {
  const [checklist, setChecklist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadChecklist() }, [])

  const loadChecklist = async () => {
    setLoading(true)
    const { data } = await supabase.from('stage_checklist').select('*').order('stage_number').order('id')
    setChecklist(data || [])
    setLoading(false)
  }

  const toggleItem = async (item) => {
    const newVal = !item.is_completed
    await supabase.from('stage_checklist').update({ is_completed: newVal, completed_date: newVal ? new Date().toISOString().split('T')[0] : null, completed_by: newVal ? user.id : null }).eq('id', item.id)
    await supabase.from('activity_log').insert({ action: `Stage checklist: "${item.item_text.substring(0,50)}..." marked ${newVal ? 'complete' : 'incomplete'}`, entity_type: 'stage_checklist', performed_by: user.id })
    loadChecklist()
  }

  const stage1 = checklist.filter(c => c.stage_number === 1)
  const stage2 = checklist.filter(c => c.stage_number === 2)
  const stage2done = stage2.filter(c => c.is_completed).length
  const stage3Items = [
    'Regular meetings with full participation by all members',
    'Strategy created for collaborating to reach UPGs',
    'One or more missionary training programs initiated',
    'Member entities engaged in Exponential Disciple-making',
    'Movement mentoring process developed',
    'Resources (faculty, training, personnel) shared among hub members',
    'Regular reporting to GlobeServe — stories, updates, prayer requests',
  ]

  return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Stage progress</div><div className="page-sub">Track progress through GlobeServe's 5 hub development stages · Current: Stage 2 — Pioneering</div></div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-header"><div className="card-title"><Icons.Chart /> Overall progress</div></div>
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
      </div>

      {loading ? <div className="empty"><Icons.Loader /></div> : (
        <>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-title" style={{color:'var(--accent)'}}><Icons.Check /> Stage 1 — Envisioning (complete)</div><span className="badge badge-green">Done</span></div>
            {stage1.map((item, i) => (
              <div key={i} className="check-item" style={{cursor:'default'}}>
                <div className="check-box checked"><Icons.Check /></div>
                <div style={{color:'var(--text-2)'}}>{item.item_text}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{marginBottom:16}}>
            <div className="card-header">
              <div className="card-title" style={{color:'#2563eb'}}><Icons.Loader /> Stage 2 — Pioneering (current)</div>
              <span className="badge badge-blue">{stage2done} / {stage2.length}</span>
            </div>
            <div style={{marginBottom:12}}>
              <div className="progress-wrap"><div className="progress-bar" style={{width:`${(stage2done/Math.max(stage2.length,1))*100}%`,background:'#2563eb'}}></div></div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>{stage2done} of {stage2.length} criteria met · Click to mark complete</div>
            </div>
            {stage2.map((item, i) => (
              <div key={i} className="check-item" onClick={() => toggleItem(item)}>
                <div className={`check-box ${item.is_completed?'checked':''}`}><Icons.Check /></div>
                <div style={{color:item.is_completed?'var(--text-2)':'var(--text)'}}>{item.item_text}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{color:'var(--text-3)'}}><Icons.Lock /> Stage 3 — Maturing (next milestone)</div></div>
            {stage3Items.map((item, i) => (
              <div key={i} className="check-item" style={{cursor:'default'}}>
                <div className="check-box" style={{borderColor:'var(--border)',opacity:0.5}}><Icons.Check /></div>
                <div style={{color:'var(--text-3)'}}>{item}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── SUBMIT REPORT ───────────────────────────────────────────
export function SubmitReport({ user }) {
  const [form, setForm] = useState({ period: '', activities: '', upg_updates: '', stories: '', prayer_requests: '', resources_needed: '' })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const content = `REPORTING PERIOD: ${form.period}\n\nACTIVITIES:\n${form.activities}\n\nUPG UPDATES:\n${form.upg_updates}\n\nTESTIMONIES & STORIES:\n${form.stories}\n\nPRAYER REQUESTS:\n${form.prayer_requests}\n\nRESOURCES NEEDED:\n${form.resources_needed}`
    await supabase.from('documents').insert({ title: `Progress Report — ${form.period}`, type: 'Progress report', doc_date: new Date().toISOString().split('T')[0], summary: `Quarterly report for ${form.period}`, content, uploaded_by: user.id })
    await supabase.from('activity_log').insert({ action: `Report draft saved for ${form.period}`, entity_type: 'documents', performed_by: user.id })
    setSaved(true); setSaving(false)
  }

  return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Submit report to GlobeServe</div><div className="page-sub">Prepare your hub's progress report. GlobeServe expects regular updates on research, testimonies, and prayer requests.</div></div>
      <div className="card">
        <div className="card-header"><div className="card-title"><Icons.Send /> Quarterly progress report</div></div>
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Reporting period *</label><input value={form.period} onChange={e => setForm({...form,period:e.target.value})} placeholder="e.g. Q2 2025 (April – June)" required /></div>
          <div className="form-group"><label className="form-label">Hub activities this period</label><textarea value={form.activities} onChange={e => setForm({...form,activities:e.target.value})} placeholder="Meetings held, events, training activities, new members..." /></div>
          <div className="form-group"><label className="form-label">UPG engagement updates</label><textarea value={form.upg_updates} onChange={e => setForm({...form,upg_updates:e.target.value})} placeholder="Progress on Fulani, Kanuri, Bariba engagement — who is engaged, what stage, what is happening..." /></div>
          <div className="form-group"><label className="form-label">Testimonies & stories</label><textarea value={form.stories} onChange={e => setForm({...form,stories:e.target.value})} placeholder="Encouraging stories from member entities — salvations, church plants, breakthroughs..." /></div>
          <div className="form-group"><label className="form-label">Challenges & prayer requests</label><textarea value={form.prayer_requests} onChange={e => setForm({...form,prayer_requests:e.target.value})} placeholder="Areas where the hub needs prayer or support from the GlobeServe family..." /></div>
          <div className="form-group"><label className="form-label">Resources needed from GlobeServe</label><textarea value={form.resources_needed} onChange={e => setForm({...form,resources_needed:e.target.value})} placeholder="Training, expertise, connections, or resources needed from the wider GlobeServe network..." /></div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save report draft'}</button>
          </div>
          {saved && <div style={{marginTop:12,fontSize:13,color:'var(--accent)',display:'flex',alignItems:'center',gap:6}}><Icons.Check /> Report saved to Documents. Share with your coordinator before submission.</div>}
        </form>
      </div>
    </div>
  )
}
