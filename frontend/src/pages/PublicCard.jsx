import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import ProfileCardView from '../components/ProfileCardView';

// Public, login-free page for a shared TaskFlow card (/u/:handle).
export default function PublicCard() {
  const { handle } = useParams();
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.get(`/users/public/${encodeURIComponent(handle)}`)
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) setError(err?.response?.data?.error || 'Could not load this card.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [handle]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', gap: 20 }}>
      <Link to="/" style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, textDecoration: 'none', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TaskFlow</Link>
      {loading && <div className="spinner" />}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <div style={{ color: 'var(--text-2)', fontSize: 14 }}>{error}</div>
        </div>
      )}
      {!loading && data && <ProfileCardView profile={data.profile} stats={data.stats} />}
      <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Create your own TaskFlow card</Link>
    </div>
  );
}
