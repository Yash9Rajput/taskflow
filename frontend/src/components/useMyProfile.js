import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// Loads the signed-in user's full profile + stats from the backend.
export default function useMyProfile() {
  const [profile, setProfile] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    return api.get('/users/me/profile')
      .then(res => { setProfile(res.data.profile); setStats(res.data.stats); })
      .catch(err => setError(err?.response?.data?.error || err?.message || 'Could not load your profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { profile, setProfile, stats, loading, error, reload: load };
}
