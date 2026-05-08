import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CursorGlow from '../components/CursorGlow';

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#lg2)"/>
    <defs><linearGradient id="lg2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

function HelpModal({ onClose }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border-hi)',borderRadius:24,padding:'2rem',width:340,textAlign:'center',boxShadow:'0 32px 80px rgba(0,0,0,0.7)',animation:'scaleIn 0.25s'}}>
        <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 1rem'}}>❓</div>
        <div style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:700,marginBottom:4}}>Help & Support</div>
        <div style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'1.5rem'}}>How can we assist you?</div>
        <a href="mailto:rajput.kyar@gmail.com"
          style={{display:'block',padding:'12px 16px',borderRadius:12,background:'var(--bg-hover)',border:'1px solid var(--border)',color:'var(--accent)',fontWeight:500,fontSize:13,textDecoration:'none',marginBottom:10,transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='rgba(99,102,241,0.1)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-hover)';}}>
          📧 rajput.kyar@gmail.com
        </a>
        <div style={{fontSize:11,color:'var(--text-3)',marginBottom:'1.5rem'}}>Click to open your mail client</div>
        <button onClick={onClose} style={{width:'100%',padding:'11px',borderRadius:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',fontWeight:600,cursor:'pointer',fontSize:14,fontFamily:'var(--font-b)'}}>Close</button>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async(e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch(err) { setError(err.response?.data?.error || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    alert('Google OAuth requires backend configuration. Please use email/password for now.');
  };

  return (
    <div className="auth-wrap">
      <CursorGlow/>
      {showHelp && <HelpModal onClose={()=>setShowHelp(false)}/>}
      <div className="auth-card au">
        <div className="auth-logo"><Logo/> TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'1.75rem',color:'var(--text-2)',fontSize:14}}>Your team's mission control</div>
        <div className="auth-box">
          <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:'1.5rem'}}>Welcome back</h2>

          {/* Google button */}
          <button onClick={handleGoogle} style={{width:'100%',padding:'11px 16px',borderRadius:'var(--r-sm)',border:'1px solid var(--border-hi)',background:'rgba(255,255,255,0.05)',color:'var(--text)',fontFamily:'var(--font-b)',fontSize:14,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:'1.25rem',transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.25)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='var(--border-hi)';}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.25rem'}}>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
            <span style={{fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>or email</span>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="field">
              <label>Email address</label>
              <input type="email" name="email" autoComplete="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required/>
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" autoComplete="current-password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Your password" required/>
            </div>
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem'}}>{error}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14,borderRadius:'var(--r-sm)'}} disabled={loading}>
              {loading?'Signing in…':'Sign in →'}
            </button>
          </form>

          <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
            No account? <Link to="/signup" style={{color:'#a5b4fc',fontWeight:600}}>Create one free</Link>
          </div>
          <div style={{marginTop:'0.75rem',textAlign:'center'}}>
            <button onClick={()=>setShowHelp(true)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:12,textDecoration:'underline',fontFamily:'var(--font-b)'}}>
              ❓ Help & Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
