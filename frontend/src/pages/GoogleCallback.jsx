import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CursorGlow from '../components/CursorGlow';

/**
 * GoogleCallback.jsx
 *
 * Route: /auth/callback
 *
 * After Google OAuth, the backend redirects here with:
 *   /auth/callback#token=<JWT>&user=<JSON>
 *
 * This page reads the hash, saves the session, and redirects to dashboard.
 * Using the hash (#) means the token is NEVER sent to any server in future
 * navigation — it stays client-side only.
 */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      // Parse hash: #token=...&user=...
      const hash   = window.location.hash.slice(1); // remove leading #
      const params = new URLSearchParams(hash);
      const token  = params.get('token');
      const user   = params.get('user');

      if (!token || !user) {
        setError('Invalid callback. Missing token or user data.');
        setTimeout(() => navigate('/login?error=google_token_failed'), 2000);
        return;
      }

      const userObj = JSON.parse(decodeURIComponent(user));

      // Save session (same keys as AuthContext)
      sessionStorage.setItem('tf_token', token);
      sessionStorage.setItem('tf_user', JSON.stringify(userObj));

      // Clean up URL hash before navigating
      window.history.replaceState(null, '', '/auth/callback');

      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Google callback parse error:', err);
      setError('Something went wrong processing your sign-in.');
      setTimeout(() => navigate('/login?error=google_server_error'), 2000);
    }
  }, [navigate]);

  return (
    <div className="auth-wrap">
      <CursorGlow/>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'2rem',textAlign:'center'}}>
        {error ? (
          <>
            <div style={{fontSize:40}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,color:'#f87171'}}>{error}</div>
            <div style={{fontSize:13,color:'var(--text-2)'}}>Redirecting you back to login…</div>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div style={{
              width:48,height:48,
              border:'4px solid rgba(99,102,241,0.15)',
              borderTopColor:'#6366f1',
              borderRadius:'50%',
              animation:'spin 0.8s linear infinite',
            }}/>
            <div>
              <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:6}}>
                Signing you in with Google…
              </div>
              <div style={{fontSize:13,color:'var(--text-2)'}}>Just a moment</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
