import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card animate-up">
        <div className="auth-logo">⬡ TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>Sign in to your workspace</div>
        </div>
        <div className="auth-box">
          <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,marginBottom:'1.5rem'}}>Welcome back</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Your password" required />
            </div>
            {error && (
              <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--radius-sm)',padding:'10px 14px',fontSize:13,color:'#f87171',marginBottom:'1rem'}}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}} disabled={loading}>
              {loading ? <><span style={{animation:'spin 0.8s linear infinite',display:'inline-block',marginRight:6}}>⟳</span> Signing in…</> : 'Sign in →'}
            </button>
          </form>
          <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-secondary)'}}>
            Don't have an account?{' '}
            <Link to="/signup" style={{color:'#818cf8',fontWeight:500}}>Create one free</Link>
          </div>
        </div>
        <div style={{marginTop:'1.5rem',padding:'1rem',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:'var(--radius-md)',fontSize:12,color:'var(--text-secondary)'}}>
          <span style={{color:'#818cf8',fontWeight:600}}>Demo:</span> Sign up with Admin role to explore all features
        </div>
      </div>
    </div>
  );
}
