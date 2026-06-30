import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#fl2)"/>
    <defs><linearGradient id="fl2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

function FooterColumn({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="footer-col">
      {/* Header — acts as accordion toggle on mobile only (via CSS) */}
      <div
        className="footer-col-head"
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.75rem' }}>{title}</div>
        <span className="footer-col-arrow" style={{ fontSize: 11, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginBottom: '0.75rem' }}>▾</span>
      </div>
      <div className={`footer-col-body${open ? ' open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = (e) => { e.preventDefault(); if (email) { setSubscribed(true); setEmail(''); } };
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'rgba(7,7,15,0.95)', marginTop: '3rem', position: 'relative', zIndex: 1 }}>
      {/* Main grid — responsive via .footer-grid CSS class */}
      <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '2rem' }}>

        {/* Brand */}
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.75rem' }}>
            <Logo/>
            <span style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#a5b4fc,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TaskFlow</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 280, marginBottom: '1rem' }}>
            A full-stack team task manager built with React, Node.js, and PostgreSQL. Designed for teams who want clarity, speed, and beautiful UX.
          </p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email"
                style={{ flex: 1, minWidth: 140, padding: '8px 10px', fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', maxWidth: 220, boxSizing: 'border-box' }}/>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'var(--grad)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
            </form>
          ) : (
            <div style={{ fontSize: 12, color: '#34d399' }}>✓ Thanks for subscribing!</div>
          )}
        </div>

        {/* Product */}
        <FooterColumn title="Product">
          {[{label:'Dashboard',to:'/'},{label:'Projects',to:'/projects'},{label:'Tasks',to:'/tasks'},{label:'Team',to:'/team'},{label:'Notes',to:'/notes'},{label:'✦ AI Assistant',to:'/ai'}].map(item => (
            <Link key={item.label} to={item.to} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>{item.label}</Link>
          ))}
        </FooterColumn>

        {/* Company */}
        <FooterColumn title="Company">
          {[{label:'About TaskFlow',to:'/about'},{label:'About Developer',to:'/developer'},{label:'Privacy Policy',to:'/privacy'}].map(item => (
            <Link key={item.label} to={item.to} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>{item.label}</Link>
          ))}
        </FooterColumn>

        {/* Contact */}
        <FooterColumn title="Contact">
          <a href="mailto:rajput.kyar@gmail.com" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s', wordBreak: 'break-all' }}
            onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>📧 rajput.kyar@gmail.com</a>
          <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#67e8f9'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>🔗 LinkedIn</a>
          <a href="https://github.com/Yash9Rajput" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>⬡ GitHub</a>
          <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 10, color: '#34d399', width: 'fit-content' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
            All systems operational
          </div>
        </FooterColumn>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1.5rem' }}>
        <div className="footer-bottom" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="footer-bottom-text" style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.7 }}>
            © {year} TaskFlow · Built with ❤️ by{' '}
            <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none' }}>Yash Rajput</a>
            <span className="footer-tech-stack">
              {' '}·{' '}
              {['React','Node.js','Express','PostgreSQL','JWT Auth'].map((t,i,arr) => (
                <span key={t} style={{ color: 'var(--text-3)' }}>{t}{i<arr.length-1?' · ':''}</span>
              ))}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[{label:'About',to:'/about'},{label:'Developer',to:'/developer'},{label:'Privacy',to:'/privacy'}].map(item => (
              <Link key={item.label} to={item.to} style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
