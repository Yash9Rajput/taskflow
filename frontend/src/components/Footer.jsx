import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#fl2)"/>
    <defs><linearGradient id="fl2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'rgba(7,7,15,0.95)', marginTop: '4rem', position: 'relative', zIndex: 1 }}>
      {/* Main footer grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 2.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem' }}>

        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <Logo/>
            <span style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg,#a5b4fc,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TaskFlow</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, maxWidth: 260, marginBottom: '1.5rem' }}>
            A full-stack team task manager built with React, Node.js, and PostgreSQL. Designed for teams who want clarity, speed, and beautiful UX.
          </p>
          {/* Newsletter */}
          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '8px 12px', fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', maxWidth: 200 }}/>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'var(--grad)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
            </form>
          ) : (
            <div style={{ fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>✓ Thanks for subscribing!</div>
          )}
        </div>

        {/* Product links */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>Product</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Dashboard',    to: '/'         },
              { label: 'Projects',     to: '/projects' },
              { label: 'Tasks',        to: '/tasks'    },
              { label: 'Team',         to: '/team'     },
              { label: 'Notes',        to: '/notes'    },
              { label: '✦ AI Assistant', to: '/ai'    },
            ].map(item => (
              <Link key={item.label} to={item.to} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Company links */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>Company</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'About TaskFlow',   to: '/about'     },
              { label: 'About Developer',  to: '/developer' },
              { label: 'Privacy Policy',   to: '/privacy'   },
            ].map(item => (
              <Link key={item.label} to={item.to} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="mailto:rajput.kyar@gmail.com" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
              📧 rajput.kyar@gmail.com
            </a>
            <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = '#67e8f9'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
              🔗 LinkedIn
            </a>
            <a href="https://github.com/Yash9Rajput" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
              ⬡ GitHub
            </a>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, color: '#34d399' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
            All systems operational
          </div>
        </div>
      </div>

      {/* Tech stack bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {['React', 'Node.js', 'Express', 'PostgreSQL', 'Railway', 'Claude AI'].map(tech => (
            <span key={tech} style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }}/>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>© {year} TaskFlow. Built with ❤️ by <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none' }}>Yash Rajput</a></div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'About', to: '/about' }, { label: 'Developer', to: '/developer' }, { label: 'Privacy', to: '/privacy' }].map(item => (
              <Link key={item.label} to={item.to} style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
