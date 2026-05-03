import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field } from '../components/UI';

export default function Signup() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  const card = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem' };
  const inp  = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background-tertiary)', padding: '2rem' }}>
      <div style={{ width: 380 }}>
        <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>&#9670; TaskFlow</div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>Create account</div>
          <form onSubmit={handleSubmit}>
            <Field label="Full name">
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
            </Field>
            <Field label="Email">
              <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" required />
            </Field>
            <Field label="Role">
              <select style={inp} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            {error && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <Button variant="primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#185FA5' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
