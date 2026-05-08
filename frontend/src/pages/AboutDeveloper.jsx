import React from 'react';
import { Link } from 'react-router-dom';

const SkillBadge = ({ name, color }) => (
  <div style={{ padding: '6px 14px', borderRadius: 999, background: `${color}18`, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 600, color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {name}
  </div>
);

const TimelineItem = ({ year, title, desc, color = '#6366f1', last = false }) => (
  <div style={{ display: 'flex', gap: 20, paddingBottom: last ? 0 : '2rem', position: 'relative' }}>
    {!last && <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: 'linear-gradient(to bottom,var(--border),transparent)' }} />}
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{year}</div>
    <div>
      <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{desc}</div>
    </div>
  </div>
);

export default function AboutDeveloper() {
  const skills = [
    { name: 'React.js',     color: '#06b6d4' }, { name: 'Node.js',   color: '#10b981' },
    { name: 'Express.js',   color: '#6366f1' }, { name: 'PostgreSQL', color: '#3b82f6' },
    { name: 'JavaScript',   color: '#f59e0b' }, { name: 'Python',    color: '#a78bfa' },
    { name: 'REST APIs',    color: '#ec4899' }, { name: 'JWT Auth',  color: '#34d399' },
    { name: 'Git & GitHub', color: '#8b5cf6' }, { name: 'Railway',   color: '#f97316' },
    { name: 'SQL',          color: '#06b6d4' }, { name: 'CSS',       color: '#6366f1' },
  ];

  const projects = [
    { icon: '⬡', title: 'TaskFlow',        desc: 'Full-stack team task manager with AI integration, RBAC, real-time dashboard, and Railway deployment.',  tech: 'React · Node · PostgreSQL · Claude AI', color: '#6366f1' },
    { icon: '🔐', title: 'Auth System',    desc: 'JWT-based authentication with role-based access, refresh tokens, and bcrypt password hashing.',           tech: 'Node.js · Express · JWT · bcryptjs',   color: '#8b5cf6' },
    { icon: '📊', title: 'Dashboard UI',   desc: 'Responsive analytics dashboard with donut charts, bar charts, sparklines, and animated data viz.',        tech: 'React · CSS · SVG Charts',             color: '#06b6d4' },
    { icon: '✦',  title: 'AI Integration', desc: 'Embedded Claude AI assistant with file upload, multi-turn conversation, and contextual project awareness.',tech: 'React · Anthropic API · Streams',       color: '#a78bfa' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* THE BUILDER tag */}
      <div style={{ marginBottom: '3rem', paddingTop: '2rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>THE BUILDER</div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 44, fontWeight: 700, lineHeight: 1.15, marginBottom: '0.5rem' }}>
          Built by someone<br />who needed it.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, maxWidth: 520 }}>
          Every line of TaskFlow was written by one developer who set out to build a real, production-grade team tool — not just a portfolio project.
        </p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '3rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 120, height: 120, borderRadius: 20, overflow: 'hidden', border: '3px solid rgba(99,102,241,0.4)', boxShadow: '0 0 40px rgba(99,102,241,0.25)' }}>
              <img src="/yash.jpg" alt="Yash Rajput" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);font-size:40px;font-weight:700;color:white;font-family:var(--font-d)">Y</div>'; }} />
            </div>
            <div style={{ position: 'absolute', bottom: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>
          </div>

          {/* Bio */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 700 }}>Yash Rajput</h2>
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, fontWeight: 600, color: '#34d399' }}>Available for Work</span>
            </div>
            <div style={{ fontSize: 14, color: '#a5b4fc', fontWeight: 500, marginBottom: '0.75rem' }}>Full-Stack Developer & UI Engineer</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.85, marginBottom: '1.25rem' }}>
              A passionate full-stack developer from India who loves turning complex problems into clean, beautiful software. I build end-to-end applications — from database schema to pixel-perfect UI — with a focus on developer experience and real-world usability.
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.85, marginBottom: '1.5rem' }}>
              TaskFlow is one of my flagship projects — a complete production system that showcases full-stack architecture, modern React patterns, RESTful APIs, AI integration, and thoughtful UX design all working together seamlessly.
            </p>

            {/* Contact links */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="mailto:rajput.kyar@gmail.com"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.transform = 'none'; }}>
                📧 rajput.kyar@gmail.com
              </a>
              <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                🔗 linkedin/yashrajput
              </a>
              <a href="https://github.com/Yash9Rajput" target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                ⬡ GitHub/Yash9Rajput
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>TECH STACK</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700, marginBottom: '1.25rem' }}>Skills & Technologies</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {skills.map(s => <SkillBadge key={s.name} {...s} />)}
        </div>
      </div>

      {/* Projects */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>WORK</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700, marginBottom: '1.25rem' }}>Featured Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {projects.map(p => (
            <div key={p.title} className="card" style={{ padding: '1.5rem', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${p.color}44`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${p.color}18`, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.icon}</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600 }}>{p.title}</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '0.75rem' }}>{p.desc}</p>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{p.tech}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>JOURNEY</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700, marginBottom: '1.5rem' }}>The Path Here</h2>
        <div className="card" style={{ padding: '2rem' }}>
          <TimelineItem year="'21" title="Started Coding"          desc="Picked up programming with Python and basic web development. Fell in love with building things from scratch."       color="#6366f1" />
          <TimelineItem year="'22" title="Frontend Focus"          desc="Dived deep into React.js and modern CSS. Built dozens of UI components and learned design systems."               color="#8b5cf6" />
          <TimelineItem year="'23" title="Full-Stack Jump"         desc="Added Node.js, Express, and SQL to the stack. Built first end-to-end authenticated web application."             color="#06b6d4" />
          <TimelineItem year="'24" title="AI Integration"          desc="Started integrating LLM APIs into web apps. Explored prompt engineering and multi-modal AI capabilities."        color="#10b981" />
          <TimelineItem year="'25" title="TaskFlow"                desc="Built TaskFlow — a complete production system demonstrating everything learned: full-stack, AI, DevOps, UX."     color="#f59e0b" last />
        </div>
      </div>

      {/* Philosophy */}
      <div style={{ padding: '2.5rem', borderRadius: 'var(--r-xl)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: '1rem' }}>💬</div>
        <blockquote style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 600, lineHeight: 1.5, marginBottom: '1rem', color: 'var(--text)', fontStyle: 'normal' }}>
          "Don't just build features.<br />Build things people actually want to use."
        </blockquote>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>— Yash Rajput, Developer of TaskFlow</div>
      </div>

      {/* Contact CTA */}
      <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>Want to work together?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: '1.5rem' }}>I'm open to collaborations, freelance projects, and full-time opportunities.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:rajput.kyar@gmail.com" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: 13, textDecoration: 'none' }}>📧 Email Me</a>
          <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" className="btn" style={{ padding: '10px 22px', fontSize: 13, textDecoration: 'none' }}>🔗 LinkedIn</a>
          <Link to="/" className="btn" style={{ padding: '10px 22px', fontSize: 13 }}>Open TaskFlow →</Link>
        </div>
      </div>
    </div>
  );
}
