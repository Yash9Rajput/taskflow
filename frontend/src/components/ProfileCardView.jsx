import React, { forwardRef } from 'react';

// The shareable TaskFlow card. Colours are hard-coded (not theme variables) so the
// downloaded image always looks the same, whichever theme the viewer uses.

const GitHubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
);
const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
);

const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
const colorFor = (name = '') => PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];

const ProfileCardView = forwardRef(function ProfileCardView({ profile, stats }, ref) {
  const name = profile?.name || 'TaskFlow User';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const accent = colorFor(name);
  const skills = (profile?.skills || []).slice(0, 6);
  const links = [
    profile?.github   && { href: profile.github,   icon: <GitHubIcon />,   label: 'GitHub' },
    profile?.linkedin && { href: profile.linkedin, icon: <LinkedInIcon />, label: 'LinkedIn' },
    profile?.website  && { href: profile.website,  icon: <GlobeIcon />,    label: 'Website' },
  ].filter(Boolean);
  const since = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;

  const box = { flex: 1, textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 };

  return (
    <div ref={ref} style={{
      width: 300, padding: 18, borderRadius: 22, color: '#eeeeff', boxSizing: 'border-box',
      fontFamily: "'Satoshi', system-ui, sans-serif",
      background: 'linear-gradient(160deg,#16162b 0%,#0b0b16 55%,#120d26 100%)',
      border: '1.5px solid rgba(139,92,246,0.45)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(99,102,241,0.18)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative glow */}
      <div style={{ position: 'absolute', top: -70, left: '50%', width: 260, height: 260, marginLeft: -130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.30),transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>
            Task<span style={{ color: '#a78bfa' }}>Flow</span>
            <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.18em', color: '#8887aa', fontWeight: 600 }}>CARD</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: profile?.role === 'admin' ? 'rgba(139,92,246,0.22)' : 'rgba(6,182,212,0.16)', color: profile?.role === 'admin' ? '#c4b5fd' : '#67e8f9', border: `1px solid ${profile?.role === 'admin' ? 'rgba(139,92,246,0.4)' : 'rgba(6,182,212,0.3)'}` }}>
            {profile?.role === 'admin' ? '👑 ADMIN' : '👤 MEMBER'}
          </span>
        </div>

        {/* avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 112, height: 112, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)' }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '3px solid #0b0b16', boxSizing: 'border-box' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `${accent}26`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 700, border: '3px solid #0b0b16', boxSizing: 'border-box' }}>{initials}</div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 19, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {name}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 1l2.4 2.1 3.2-.3 1.1 3 2.9 1.5-.9 3.1 1.5 2.8-2.3 2.2-.1 3.2-3.1.8L12 23l-2.7-2.6-3.1-.8-.1-3.2L3.8 14l1.5-2.8-.9-3.1 2.9-1.5 1.1-3 3.2.3L12 1z"/><path d="M8.5 12.2l2.3 2.3 4.7-4.9" fill="none" stroke="#0b0b16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          {profile?.handle && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#c4b5fd', background: 'rgba(139,92,246,0.14)', padding: '3px 12px', borderRadius: 999, border: '1px solid rgba(139,92,246,0.25)' }}>@{profile.handle}</span>
            </div>
          )}
          {profile?.bio && <div style={{ fontSize: 11.5, color: '#9a99bd', marginTop: 9, lineHeight: 1.5, padding: '0 6px' }}>{profile.bio}</div>}
        </div>

        {/* stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Projects',   v: stats?.projects ?? 0,    c: '#a5b4fc' },
            { l: 'Tasks Done', v: stats?.tasks_done ?? 0,  c: '#34d399' },
            { l: 'Active Days', v: stats?.active_days ?? 0, c: '#fbbf24' },
          ].map(s => (
            <div key={s.l} style={box}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8887aa', marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {links.length > 0 && (
          <div style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8887aa', marginBottom: 8, fontWeight: 600 }}>You can find me on</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {links.map(l => (
                <span key={l.label} title={l.label} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{l.icon}</span>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {skills.map(sk => (
              <span key={sk} style={{ fontSize: 10, fontWeight: 600, color: '#cfd0ee', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 999 }}>#{sk.toUpperCase()}</span>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 9, color: '#55547a', marginTop: 12, letterSpacing: '0.08em' }}>
          {since ? `MEMBER SINCE ${since} · ` : ''}TASKFLOW
        </div>
      </div>
    </div>
  );
});

export default ProfileCardView;
