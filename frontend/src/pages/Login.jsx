import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field } from '../components/UI';

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
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const card = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem' };
  const inp  = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background-tertiary)', padding: '2rem' }}>
      <div style={{ width: 380 }}>
        <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>&#9670; TaskFlow</div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>Sign in</div>
          <form onSubmit={handleSubmit}>
            <Field label="Email">
              <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Password" required />
            </Field>
            {error && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <Button variant="primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#185FA5' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
