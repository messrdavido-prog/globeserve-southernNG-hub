import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icons } from '../components/Icons'

const MINISTRY_FOCUS_OPTIONS = ['Church planting', 'Missionary sending', 'Missionary training', 'Unreached people groups', 'Student ministry', 'Community development', 'Bible translation', 'Other']
const CHALLENGE_OPTIONS = ['Funding', 'Missionary recruitment', 'Missionary training', 'Member care', 'Leadership development', 'Partnerships', 'Security', 'Resource mobilisation', 'Other']
const SUPPORT_OPTIONS = ['Training', 'Research', 'Networking', 'Prayer', 'Resource sharing', 'Funding opportunities', 'Member care', 'Advocacy', 'Other']
const STAGE_OPTIONS = [
  'UPG adoption',
  'Engagement of the UPG',
  'First Disciples are brought to Christ',
  'First Church is Planted',
  'First 2nd Generation Church is Planted',
  'Church planting Movement begins',
  'Movement Catalysts Fielded to other UPGs',
]

const EMPTY = {
  organisation_name: '', states_of_operation: '', org_type: '', active_missionaries: '',
  ministry_focus: [], ministry_focus_other: '',
  top_challenges: [], top_challenges_other: '',
  support_areas: [], support_areas_other: '',
  upgs_engaging: '',
  engagement_stage: '',
  training_needed: '',
  priorities_next_3_years: '',
}

const STEP_TITLES = [
  'Organisation Information',
  'Ministry Focus',
  'Greatest Challenges',
  'Support Needed',
  'Unreached People Groups',
  'Stage of Engagement',
  'Training Needs',
  'Future Priorities',
  'Review & Submit',
]

export default function NeedsAssessment({ user }) {
  const [mode, setMode] = useState('list') // 'list' | 'wizard' | 'done'
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { loadAssessments() }, [])

  const loadAssessments = async () => {
    setLoading(true)
    const { data } = await supabase.from('needs_assessments').select('*').order('created_at', { ascending: false })
    setAssessments(data || [])
    setLoading(false)
  }

  const startWizard = () => { setForm(EMPTY); setStep(0); setMode('wizard') }

  const toggleMulti = (field, value) => {
    setForm(f => {
      const has = f[field].includes(value)
      return { ...f, [field]: has ? f[field].filter(v => v !== value) : [...f[field], value] }
    })
  }

  const totalSteps = STEP_TITLES.length
  const isLast = step === totalSteps - 1
  const canProceed = step === 0 ? form.organisation_name.trim().length > 0 : true

  const handleNext = () => { if (!isLast) setStep(s => s + 1) }
  const handleBack = () => setStep(s => Math.max(0, s - 1))

  const handleSubmit = async () => {
    setSaving(true)
    const payload = { ...form, active_missionaries: form.active_missionaries ? parseInt(form.active_missionaries) : null, submitted_by: user.id }
    const { error } = await supabase.from('needs_assessments').insert(payload)
    if (!error) {
      await supabase.from('activity_log').insert({ action: `Needs assessment submitted: ${form.organisation_name}`, entity_type: 'needs_assessments', performed_by: user.id })
      setMode('done')
      loadAssessments()
    }
    setSaving(false)
  }

  const summarize = (list, other) => [...list.filter(v => v !== 'Other'), list.includes('Other') && other].filter(Boolean).join(', ') || '—'

  const ProgressBar = () => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Step {step + 1} of {totalSteps}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{STEP_TITLES[step]}</span>
      </div>
      <div className="progress-wrap"><div className="progress-bar" style={{ width: `${((step + 1) / totalSteps) * 100}%` }}></div></div>
    </div>
  )

  const CheckGroup = ({ field, options }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
      {options.map(opt => {
        const active = form[field].includes(opt)
        return (
          <button type="button" key={opt} onClick={() => toggleMulti(field, opt)}
            style={{
              padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
              border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: active ? 'var(--accent-light)' : 'var(--surface2)',
              color: active ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer',
            }}>
            {active ? '✓ ' : ''}{opt}
          </button>
        )
      })}
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="form-group">
              <label className="form-label">Organisation name *</label>
              <input value={form.organisation_name} onChange={e => setForm({ ...form, organisation_name: e.target.value })} placeholder="e.g. Grace Mission Church" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">State(s) of operation</label>
              <input value={form.states_of_operation} onChange={e => setForm({ ...form, states_of_operation: e.target.value })} placeholder="e.g. Rivers, Delta, Bayelsa" />
            </div>
            <div className="form-group">
              <label className="form-label">Type of organisation</label>
              <input value={form.org_type} onChange={e => setForm({ ...form, org_type: e.target.value })} placeholder="e.g. Church, training school, sending agency..." />
            </div>
            <div className="form-group">
              <label className="form-label">Number of active missionaries</label>
              <input type="number" min="0" value={form.active_missionaries} onChange={e => setForm({ ...form, active_missionaries: e.target.value })} placeholder="e.g. 5" />
            </div>
          </>
        )
      case 1:
        return (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Which best describes your primary ministry? Tick all that apply.</div>
            <CheckGroup field="ministry_focus" options={MINISTRY_FOCUS_OPTIONS} />
            {form.ministry_focus.includes('Other') && (
              <input value={form.ministry_focus_other} onChange={e => setForm({ ...form, ministry_focus_other: e.target.value })} placeholder="Please specify..." />
            )}
          </>
        )
      case 2:
        return (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>What are your three greatest challenges? Tick your top few.</div>
            <CheckGroup field="top_challenges" options={CHALLENGE_OPTIONS} />
            {form.top_challenges.includes('Other') && (
              <input value={form.top_challenges_other} onChange={e => setForm({ ...form, top_challenges_other: e.target.value })} placeholder="Please specify..." />
            )}
          </>
        )
      case 3:
        return (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Which areas would you like GlobeServe Southern Nigeria Hub to support? Tick all that apply.</div>
            <CheckGroup field="support_areas" options={SUPPORT_OPTIONS} />
            {form.support_areas.includes('Other') && (
              <input value={form.support_areas_other} onChange={e => setForm({ ...form, support_areas_other: e.target.value })} placeholder="Please specify..." />
            )}
          </>
        )
      case 4:
        return (
          <div className="form-group">
            <label className="form-label">List the unreached people group(s) you are already engaging</label>
            <textarea value={form.upgs_engaging} onChange={e => setForm({ ...form, upgs_engaging: e.target.value })} placeholder="e.g. Fulani people in Delta State... Leave blank if none yet." />
          </div>
        )
      case 5:
        return (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>What stage of engagement is your organisation at? Choose one.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STAGE_OPTIONS.map(opt => (
                <label key={opt} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: form.engagement_stage === opt ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: form.engagement_stage === opt ? 'var(--accent-light)' : 'var(--surface2)',
                }}>
                  <input type="radio" name="engagement_stage" checked={form.engagement_stage === opt} onChange={() => setForm({ ...form, engagement_stage: opt })} />
                  <span style={{ fontSize: 13, color: form.engagement_stage === opt ? 'var(--accent)' : 'var(--text-2)' }}>{opt}</span>
                </label>
              ))}
            </div>
          </>
        )
      case 6:
        return (
          <div className="form-group">
            <label className="form-label">What training is most needed in your organisation?</label>
            <textarea value={form.training_needed} onChange={e => setForm({ ...form, training_needed: e.target.value })} placeholder="Describe the training your team needs most..." />
          </div>
        )
      case 7:
        return (
          <div className="form-group">
            <label className="form-label">What should GlobeServe Southern Nigeria Hub prioritise over the next three years?</label>
            <textarea value={form.priorities_next_3_years} onChange={e => setForm({ ...form, priorities_next_3_years: e.target.value })} placeholder="Share your priorities..." />
          </div>
        )
      case 8:
        return (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Please review your answers before submitting.</div>
            {[
              ['Organisation', form.organisation_name],
              ['State(s) of operation', form.states_of_operation || '—'],
              ['Type of organisation', form.org_type || '—'],
              ['Active missionaries', form.active_missionaries || '—'],
              ['Ministry focus', summarize(form.ministry_focus, form.ministry_focus_other)],
              ['Greatest challenges', summarize(form.top_challenges, form.top_challenges_other)],
              ['Support requested', summarize(form.support_areas, form.support_areas_other)],
              ['UPGs engaging', form.upgs_engaging || '—'],
              ['Engagement stage', form.engagement_stage || '—'],
              ['Training needed', form.training_needed || '—'],
              ['3-year priorities', form.priorities_next_3_years || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>
        )
      default: return null
    }
  }

  if (mode === 'done') {
    return (
      <div className="page fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--accent)' }}><Icons.Check /></div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Assessment submitted</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Thank you — your responses have been recorded.</div>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={startWizard}>Submit another</button>
            <button className="btn btn-ghost" onClick={() => setMode('list')}>Back to list</button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'wizard') {
    return (
      <div className="page fade-in">
        <div className="page-header">
          <div className="page-title">Needs assessment</div>
          <div className="page-sub">GlobeServe Southern Nigeria Hub · Need Assessment questionnaire</div>
        </div>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
          <ProgressBar />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{STEP_TITLES[step]}</div>
          {renderStep()}
          <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setMode('list')}>Cancel</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && <button className="btn btn-ghost" onClick={handleBack}>{'< Back'}</button>}
              {!isLast && <button className="btn btn-primary" disabled={!canProceed} onClick={handleNext}>{'Next >'}</button>}
              {isLast && <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>{saving ? 'Submitting...' : 'Finish'}</button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Needs assessment</div>
          <div className="page-sub">Understand each member entity's focus, challenges, and support needs</div>
        </div>
        <button className="btn btn-primary" onClick={startWizard}><Icons.Plus /> Start assessment</button>
      </div>

      {loading ? (
        <div className="empty"><Icons.Loader /><p>Loading...</p></div>
      ) : assessments.length === 0 ? (
        <div className="card"><div className="empty"><Icons.Speakerphone /><p>No assessments submitted yet. Click "Start assessment" to begin.</p></div></div>
      ) : (
        <div className="card">
          {assessments.map(a => {
            const isOpen = expandedId === a.id
            return (
              <div key={a.id}>
                <div className="data-row" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isOpen ? null : a.id)}>
                  <div className="row-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}><Icons.Speakerphone /></div>
                  <div className="row-body">
                    <div className="row-title">{a.organisation_name}</div>
                    <div className="row-sub">{[a.states_of_operation, a.engagement_stage].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span style={{ color: 'var(--text-3)', display: 'flex' }}>{isOpen ? <Icons.ArrowUp /> : <Icons.ArrowDown />}</span>
                </div>
                {isOpen && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, margin: '0 0 12px' }}>
                    {[
                      ['Type of organisation', a.org_type],
                      ['Active missionaries', a.active_missionaries],
                      ['Ministry focus', (a.ministry_focus || []).join(', ')],
                      ['Greatest challenges', (a.top_challenges || []).join(', ')],
                      ['Support requested', (a.support_areas || []).join(', ')],
                      ['UPGs engaging', a.upgs_engaging],
                      ['Engagement stage', a.engagement_stage],
                      ['Training needed', a.training_needed],
                      ['3-year priorities', a.priorities_next_3_years],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
