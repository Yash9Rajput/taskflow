import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CursorGlow from '../components/CursorGlow';

const LogoMark = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#lg)"/>
    <defs><linearGradient id="lg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async(e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email,form.password); navigate('/'); }
    catch(err){ setError(err.response?.data?.error||'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <CursorGlow/>
      <div className="auth-card au">
        <div className="auth-logo"><LogoMark/> TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'1.75rem',color:'var(--text-2)',fontSize:14}}>
          Your team's mission control
        </div>
        <div className="auth-box">
          <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:'1.5rem'}}>Welcome back</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required/>
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Your password" required/>
            </div>
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem'}}>{error}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px 18px',fontSize:14,borderRadius:'var(--r-sm)'}} disabled={loading}>
              {loading?'Signing in…':'Sign in →'}
            </button>
          </form>
          <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
            No account? <Link to="/signup" style={{color:'#a5b4fc',fontWeight:600}}>Create one free</Link>
          </div>
        </div>
        <div style={{marginTop:'1.25rem',padding:'12px 16px',background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--text-2)',textAlign:'center'}}>
          <span style={{color:'#a5b4fc',fontWeight:600}}>Tip:</span> Sign up with Admin role to unlock all features
        </div>
      </div>
    </div>
  );
}
