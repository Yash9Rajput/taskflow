import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ name:'', email:'', password:'', role:'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try { await signup(form.name, form.email, form.password, form.role); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card animate-up">
        <div className="auth-logo">⬡ TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>Create your free workspace today</div>
        </div>
        <div className="auth-box">
          <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,marginBottom:'1.5rem'}}>Create account</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" required />
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="field">
              <label>Role</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {['member','admin'].map(r => (
                  <div key={r} onClick={()=>set('role',r)}
                    style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',border:`1px solid ${form.role===r?'var(--accent)':'var(--border)'}`,background:form.role===r?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.03)',cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
                    <div style={{fontSize:18,marginBottom:2}}>{r==='admin'?'👑':'👤'}</div>
                    <div style={{fontSize:13,fontWeight:500,textTransform:'capitalize',color:form.role===r?'#818cf8':'var(--text-secondary)'}}>{r}</div>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--radius-sm)',padding:'10px 14px',fontSize:13,color:'#f87171',marginBottom:'1rem'}}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}} disabled={loading}>
              {loading ? 'Creating account…' : 'Get started →'}
            </button>
          </form>
          <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-secondary)'}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'#818cf8',fontWeight:500}}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
