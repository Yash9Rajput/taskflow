import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './UI';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#nl2)"/>
    <defs>
      <linearGradient id="nl2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

const links = [
  { to:'/',         label:'Dashboard', icon:'⊞' },
  { to:'/projects', label:'Projects',  icon:'◫' },
  { to:'/tasks',    label:'Tasks',     icon:'☑' },
  { to:'/team',     label:'Team',      icon:'👥' },
  { to:'/notes',    label:'Notes',     icon:'📝' },
  { to:'/ai',       label:'AI',        icon:'✦' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, cycle } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const isDev = DEV_EMAILS.includes(user?.email);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change (NavLink click)
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="navbar" style={{ position: 'relative', zIndex: 200 }}>
        <NavLink to="/" className="nav-logo" style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
          <Logo/> TaskFlow
        </NavLink>

        {/* Desktop links — hidden on mobile via CSS class .navbar-links */}
        <div className="navbar-links" style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={to === '/ai' ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' } : {}}>
              {to === '/ai' ? `✦ ${label}` : label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Live indicator — hidden on small mobile via CSS class */}
          <div className="navbar-live" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            <span className="pulse-dot" style={{ background: '#10b981' }}/>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Live</span>
          </div>

          {/* Theme cycler */}
          <button onClick={cycle} title={`Theme: ${theme.name}`}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'rotate(20deg) scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
            {theme.icon}
          </button>

          {/* User profile dropdown — hidden on mobile, shown in mobile menu instead */}
          <div ref={profileRef} className="navbar-profile" style={{ position: 'relative' }}>
            <div onClick={() => setProfileOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', cursor: 'pointer', background: profileOpen ? 'var(--bg-hover)' : 'transparent', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.background = 'transparent'; }}>
              <Avatar user={user} size={26}/>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', transition: 'transform 0.2s', display: 'inline-block', transform: profileOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {profileOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260, background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 500, overflow: 'hidden', animation: 'scaleIn 0.2s ease' }}>
                {/* Profile header */}
                <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar user={user} size={44}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: user?.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.15)', color: user?.role === 'admin' ? '#c4b5fd' : '#67e8f9', border: `1px solid ${user?.role === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.25)'}` }}>
                          {user?.role === 'admin' ? '👑' : '👤'} {user?.role?.toUpperCase()}
                        </span>
                        {isDev && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>⚡ DEV</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '8px 1rem 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>My Account</div>

                {[
                  { icon: '⊞', label: 'Dashboard',   sub: 'Overview & stats',      action: () => { navigate('/'); setProfileOpen(false); } },
                  { icon: '◫', label: 'My Projects',  sub: 'Projects you manage',   action: () => { navigate('/projects'); setProfileOpen(false); } },
                  { icon: '☑', label: 'My Tasks',     sub: 'Tasks assigned to you', action: () => { navigate('/tasks'); setProfileOpen(false); } },
                  { icon: '👥', label: 'My Team',     sub: 'Team members',          action: () => { navigate('/team'); setProfileOpen(false); } },
                  { icon: '📝', label: 'Notes',       sub: 'Your personal notes',   action: () => { navigate('/notes'); setProfileOpen(false); } },
                  { icon: '✦', label: 'AI Assistant', sub: 'Ask anything',          action: () => { navigate('/ai'); setProfileOpen(false); } },
                ].map(item => (
                  <div key={item.label} onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 1rem', cursor: 'pointer', transition: 'background 0.15s', fontSize: 13, color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border)', padding: '0.5rem' }}>
                  <div onClick={() => { logout(); navigate('/login'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0.75rem', cursor: 'pointer', borderRadius: 'var(--r-sm)', color: '#f87171', fontSize: 13, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    ⇤ Sign out
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="navbar-hamburger"
            onClick={() => setMobileMenuOpen(v => !v)}
            style={{
              display: 'none', width: 36, height: 36, borderRadius: 10,
              border: '1px solid var(--border)', background: mobileMenuOpen ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
              cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
            aria-label="Menu">
            <div style={{ width: 16, height: 12, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1, background: 'var(--text)', top: mobileMenuOpen ? 5 : 0, transform: mobileMenuOpen ? 'rotate(45deg)' : 'none', transition: 'all 0.25s' }}/>
              <span style={{ position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1, background: 'var(--text)', top: 5, opacity: mobileMenuOpen ? 0 : 1, transition: 'opacity 0.2s' }}/>
              <span style={{ position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1, background: 'var(--text)', top: mobileMenuOpen ? 5 : 10, transform: mobileMenuOpen ? 'rotate(-45deg)' : 'none', transition: 'all 0.25s' }}/>
            </div>
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ─────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={closeMobileMenu}
            style={{ position: 'fixed', inset: 0, top: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }}
            className="navbar-mobile-overlay"
          />
          <div className="navbar-mobile-menu" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 160,
            width: 'min(300px, 85vw)', background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-hi)', boxShadow: '-12px 0 48px rgba(0,0,0,0.5)',
            overflowY: 'auto', animation: 'slideInRight 0.25s ease',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* User card */}
            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar user={user} size={44}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
                <button onClick={closeMobileMenu} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: user?.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.15)', color: user?.role === 'admin' ? '#c4b5fd' : '#67e8f9' }}>
                  {user?.role === 'admin' ? '👑' : '👤'} {user?.role?.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: '1px solid var(--border)' }}>
                  <span className="pulse-dot" style={{ background: '#10b981', width: 6, height: 6 }}/>
                  <span style={{ fontSize: 10, color: 'var(--text-2)' }}>Live</span>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ padding: '0.75rem', flex: 1 }}>
              {links.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 12, marginBottom: 4,
                    textDecoration: 'none', fontSize: 15, fontWeight: 500,
                    color: isActive ? '#a5b4fc' : 'var(--text)',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  })}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Bottom actions */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={cycle} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '13px 14px', borderRadius: 12, marginBottom: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-b)', textAlign: 'left',
              }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{theme.icon}</span>
                Theme: {theme.name}
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '13px 14px', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'pointer', fontSize: 15, color: '#f87171', fontFamily: 'var(--font-b)', textAlign: 'left',
              }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>⇤</span>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
