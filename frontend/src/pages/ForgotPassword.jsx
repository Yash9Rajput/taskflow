import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import CursorGlow from '../components/CursorGlow';

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#fp-lg)"/>
    <defs><linearGradient id="fp-lg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Backend always returns 200 — any real error is a network/server failure
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
          {!sent ? (
            <>
              {/* Icon */}
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 8px 24px rgba(99,102,241,0.4)'}}>
                  🔑
                </div>
              </div>

              <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:6,textAlign:'center'}}>
                Forgot your password?
              </h2>
              <p style={{fontSize:13,color:'var(--text-2)',textAlign:'center',marginBottom:'1.5rem',lineHeight:1.6}}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} autoComplete="on">
                <div className="field">
                  <label>Email address</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem'}}>
                    {error}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14,borderRadius:'var(--r-sm)'}}
                  disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>

              <div style={{marginTop:'1.25rem',textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
                <Link to="/login" style={{color:'#a5b4fc',fontWeight:600}}>← Back to sign in</Link>
              </div>
            </>
          ) : (
            /* Success state */
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <div style={{width:64,height:64,borderRadius:20,background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>
                  📧
                </div>
              </div>

              <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600,marginBottom:8,textAlign:'center'}}>
                Check your inbox!
              </h2>

              <p style={{fontSize:13,color:'var(--text-2)',textAlign:'center',lineHeight:1.7,marginBottom:'1.5rem'}}>
                If an account exists for <strong style={{color:'var(--text)'}}>{email}</strong>, we've sent a password reset link. Check your spam folder if you don't see it within a minute.
              </p>

              <div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.18)',borderRadius:'var(--r-md)',padding:'14px 16px',fontSize:12,color:'var(--text-2)',marginBottom:'1.5rem',lineHeight:1.8}}>
                <strong style={{color:'#a5b4fc'}}>⏱ Link expires in 1 hour</strong><br/>
                The reset link can only be used once. If it expires, come back and request a new one.
              </div>

              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn"
                style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14,borderRadius:'var(--r-sm)',marginBottom:'0.75rem'}}>
                Try a different email
              </button>

              <div style={{textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
                <Link to="/login" style={{color:'#a5b4fc',fontWeight:600}}>← Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
