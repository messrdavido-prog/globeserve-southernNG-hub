import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [entityName, setEntityName] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        entity_name: entityName,
        role: role,
      })
    }
    setMessage('Account created! Check your email to confirm, then log in.')
    setMode('login')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">GlobeServe</div>
        <div className="auth-sub">Southern Nigeria Hub · Management Portal</div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div style={{background:'var(--accent-light)',color:'var(--accent-text)',fontSize:13,padding:'10px 14px',borderRadius:10,marginBottom:14}}>{message}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:4}} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--text-2)'}}>
              New member?{' '}
              <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:500}} onClick={() => { setMode('register'); setError('') }}>
                Create account
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Member entity / organisation</label>
              <input type="text" value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="e.g. Grace Mission Church" required />
            </div>
            <div className="form-group">
              <label className="form-label">Your role in the hub</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member representative</option>
                <option value="researcher">Researcher</option>
                <option value="secretary">Secretary</option>
                <option value="assistant_coordinator">Assistant Coordinator</option>
                <option value="coordinator">Hub Coordinator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:4}} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--text-2)'}}>
              Already have an account?{' '}
              <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:500}} onClick={() => { setMode('login'); setError('') }}>
                Sign in
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
