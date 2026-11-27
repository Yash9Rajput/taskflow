import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Spinner } from '../components/UI';
import useMyProfile from '../components/useMyProfile';

const DEV_EMAILS = ['ry1555530@gmail.com', 'rajput.kyar@gmail.com'];

const Row = ({ icon, label, value }) => value ? (
  <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
    <span style={{ width: 22, textAlign: 'center', fontSize: 15 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
    </div>
  </div>
) : null;

const LinkChip = ({ href, label, icon }) => href ? (
  <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>{icon} {label}</a>
) : null;

export default function Profile() {
  const navigate = useNavigate();
  const { profile, stats, loading, error, reload } = useMyProfile();

  if (loading) return <Spinner />;
  if (error || !profile) return (
    <div className="card" style={{ padding: '2rem', maxWidth: 520, margin: '3rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
      <div style={{ marginBottom: 14, color: 'var(--text-2)' }}>{error || 'Could not load your profile.'}</div>
      <button className="btn btn-primary" onClick={reload}>Try again</button>
    </div>
  );

  const isDev = DEV_EMAILS.includes(profile.email);
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '';
  const education = [profile.degree, profile.branch].filter(Boolean).join(' · ');

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Header card */}
      <div className="card au" style={{ overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ height: 110, background: 'linear-gradient(135deg,rgba(99,102,241,0.55),rgba(139,92,246,0.45) 55%,rgba(6,182,212,0.35))' }} />
        <div style={{ padding: '0 1.75rem 1.5rem', marginTop: -48 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ borderRadius: '50%', padding: 4, background: 'var(--bg-card)', display: 'inline-flex' }}>
              <Avatar user={profile} size={104} />
            </div>
            <div style={{ flex: 1, minWidth: 220, paddingBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{profile.name}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>@{profile.handle} · {profile.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span className={`badge badge-${profile.role}`}>{profile.role === 'admin' ? '👑 ' : '👤 '}{profile.role}</span>
                {isDev && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>⚡ DEV</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
              <button className="btn btn-primary" onClick={() => navigate('/profile/edit')}>✎ Edit Profile</button>
              <button className="btn" onClick={() => navigate('/profile/card')}>🪪 Profile Card</button>
            </div>
          </div>
          <p style={{ fontSize: 14, color: profile.bio ? 'var(--text-2)' : 'var(--text-3)', lineHeight: 1.7, marginTop: 16, fontStyle: profile.bio ? 'normal' : 'italic' }}>
            {profile.bio || 'No bio yet — add one from Edit Profile.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 au1" style={{ marginBottom: '1.25rem' }}>
        {[
          { l: 'Projects',    v: stats?.projects ?? 0,    c: '#818cf8', i: '◫' },
          { l: 'Tasks Done',  v: stats?.tasks_done ?? 0,  c: '#34d399', i: '✓' },
          { l: 'Total Tasks', v: stats?.tasks_total ?? 0, c: '#67e8f9', i: '☑' },
          { l: 'Active Days', v: stats?.active_days ?? 0, c: '#fbbf24', i: '🔥' },
        ].map(s => (
          <div key={s.l} className="stat-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad)' }} />
            <div style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', fontSize: 20, opacity: 0.55 }}>{s.i}</div>
            <div className="stat-num" style={{ color: s.c, fontSize: 32 }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 au2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="section-title" style={{ marginBottom: 6 }}>About</div>
          <Row icon="🌍" label="Country" value={profile.country} />
          <Row icon="🎓" label="College / University" value={profile.college} />
          <Row icon="📘" label="Degree & Branch" value={education} />
          <Row icon="📅" label="Graduation Year" value={profile.grad_year} />
          <Row icon="🗓️" label="Member since" value={memberSince} />
          {!profile.country && !profile.college && !education && !profile.grad_year && (
            <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '12px 0' }}>Add your education details from Edit Profile.</div>
          )}
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Skills</div>
          {profile.skills.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.25rem' }}>
              {profile.skills.map(s => (
                <span key={s} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>#{s}</span>
              ))}
            </div>
          ) : <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1.25rem' }}>No skills added yet.</div>}

          <div className="section-title" style={{ marginBottom: 12 }}>Links</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <LinkChip href={profile.github} label="GitHub" icon="⌥" />
            <LinkChip href={profile.linkedin} label="LinkedIn" icon="in" />
            <LinkChip href={profile.website} label="Website" icon="🌐" />
            {!profile.github && !profile.linkedin && !profile.website && (
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No links added yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
