import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CursorGlow from '../components/CursorGlow';

const LogoMark = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#sg)"/>
    <defs><linearGradient id="sg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

export default function Signup() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ name:'', email:'', password:'', role:'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async(e) => {
    e.preventDefault();
    if(form.password.length<6){ setError('Password min 6 characters'); return; }
    setError(''); setLoading(true);
    try { await signup(form.name,form.email,form.password,form.role); navigate('/'); }
    catch(err){ setError(err.response?.data?.error||'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <CursorGlow/>
      <div className="auth-card au">
        <div className="auth-logo"><LogoMark/> TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'1.75rem',color:'var(--text-2)',fontSize:14}}>Join your team's workspace</div>
        <div className="auth-box">
          <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:'1.5rem'}}>Create account</h2>
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Full name</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" required/></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required/></div>
            <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 6 characters" required/></div>
            <div className="field">
              <label>Role</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[{r:'member',icon:'👤',desc:'View & update tasks'},{r:'admin',icon:'👑',desc:'Full access & control'}].map(({r,icon,desc})=>(
                  <div key={r} onClick={()=>set('role',r)}
                    style={{padding:'12px',borderRadius:'var(--r-md)',border:`1.5px solid ${form.role===r?'var(--accent)':'var(--border)'}`,background:form.role===r?'rgba(99,102,241,0.1)':'rgba(255,255,255,0.02)',cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}>
                    <div style={{fontSize:24,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:13,fontWeight:600,textTransform:'capitalize',color:form.role===r?'#a5b4fc':'var(--text-2)'}}>{r}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem'}}>{error}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14,borderRadius:'var(--r-sm)'}} disabled={loading}>
              {loading?'Creating account…':'Get started free →'}
            </button>
          </form>
          <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
            Already have an account? <Link to="/login" style={{color:'#a5b4fc',fontWeight:600}}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
