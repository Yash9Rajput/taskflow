import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import CursorGlow from '../components/CursorGlow';

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#rp-lg)"/>
    <defs><linearGradient id="rp-lg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number',      pass: /\d/.test(password) },
    { label: 'Contains uppercase',     pass: /[A-Z]/.test(password) },
    { label: 'Contains symbol',        pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score  = checks.filter(c => c.pass).length;
  const colors = ['#ef4444','#f97316','#f59e0b','#10b981'];
  const labels = ['Weak','Fair','Good','Strong'];

  return (
    <div style={{marginTop:8}}>
      <div style={{display:'flex',gap:4,marginBottom:6}}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex:1, height:3, borderRadius:2,
            background: i < score ? colors[score-1] : 'var(--border)',
            transition:'background 0.3s',
          }}/>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px 12px'}}>
          {checks.map(c => (
            <span key={c.label} style={{fontSize:10,color:c.pass?'#34d399':'var(--text-3)',display:'flex',alignItems:'center',gap:3}}>
              {c.pass ? '✓' : '·'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{fontSize:11,fontWeight:600,color:colors[score-1],flexShrink:0,marginLeft:8}}>
            {labels[score-1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams]      = useSearchParams();
  const navigate             = useNavigate();
  const { saveSession }      = useAuth();         // we'll add this helper to AuthContext
  const token                = searchParams.get('token');

  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [done,    setDone]      = useState(false);

  // If no token in URL, show invalid state immediately
  const hasToken = !!token;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, form.password);
      // Backend returns a JWT + user — log them in automatically
      if (res.data?.token && res.data?.user) {
        // Save session manually (same as login)
        sessionStorage.setItem('tf_token', res.data.token);
        sessionStorage.setItem('tf_user', JSON.stringify(res.data.user));
      }
      setDone(true);
      // Redirect to dashboard after 2.5s
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <CursorGlow/>
      <div className="auth-card au">
        <div className="auth-logo"><Logo/> TaskFlow</div>
        <div style={{textAlign:'center',marginBottom:'1.75rem',color:'var(--text-2)',fontSize:14}}>Your team's mission control</div>

        <div className="auth-box">
          {!hasToken ? (
            /* No token — invalid link */
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <div style={{width:56,height:56,borderRadius:16,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>
                  ⚠️
                </div>
              </div>
              <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:8,textAlign:'center'}}>Invalid reset link</h2>
              <p style={{fontSize:13,color:'var(--text-2)',textAlign:'center',lineHeight:1.6,marginBottom:'1.5rem'}}>
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <Link to="/forgot-password" className="btn btn-primary" style={{display:'block',textAlign:'center',padding:'11px',borderRadius:'var(--r-sm)',fontSize:14,textDecoration:'none',marginBottom:'0.75rem'}}>
                Request new reset link
              </Link>
              <div style={{textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
                <Link to="/login" style={{color:'#a5b4fc',fontWeight:600}}>← Back to sign in</Link>
              </div>
            </>
          ) : done ? (
            /* Success */
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <div style={{width:64,height:64,borderRadius:20,background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>
                  ✅
                </div>
              </div>
              <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:8,textAlign:'center'}}>
                Password updated!
              </h2>
              <p style={{fontSize:13,color:'var(--text-2)',textAlign:'center',lineHeight:1.6,marginBottom:'1.5rem'}}>
                Your password has been changed successfully. Taking you to the dashboard…
              </p>
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:32,height:32,border:'3px solid var(--accent)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              </div>
            </>
          ) : (
            /* Reset form */
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 8px 24px rgba(99,102,241,0.4)'}}>
                  🔐
                </div>
              </div>

              <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:6,textAlign:'center'}}>
                Set new password
              </h2>
              <p style={{fontSize:13,color:'var(--text-2)',textAlign:'center',marginBottom:'1.5rem',lineHeight:1.6}}>
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="field">
                  <label>New password</label>
                  <div style={{position:'relative'}}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      autoFocus
                      style={{width:'100%',paddingRight:42}}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:16,padding:4,lineHeight:1}}>
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  <PasswordStrength password={form.password}/>
                </div>

                <div className="field">
                  <label>Confirm new password</label>
                  <div style={{position:'relative'}}>
                    <input
                      type={showCfm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => set('confirm', e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      style={{
                        width:'100%', paddingRight:42,
                        borderColor: form.confirm && form.password !== form.confirm ? 'rgba(239,68,68,0.5)' : undefined,
                      }}
                    />
                    <button type="button" onClick={() => setShowCfm(v => !v)}
                      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:16,padding:4,lineHeight:1}}>
                      {showCfm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {form.confirm && form.password !== form.confirm && (
                    <div style={{fontSize:11,color:'#f87171',marginTop:5}}>⚠ Passwords don't match</div>
                  )}
                </div>

                {error && (
                  <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem'}}>
                    {error}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14,borderRadius:'var(--r-sm)'}}
                  disabled={loading || (form.confirm && form.password !== form.confirm)}>
                  {loading ? 'Updating…' : 'Update password →'}
                </button>
              </form>

              <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
                <Link to="/login" style={{color:'#a5b4fc',fontWeight:600}}>← Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
