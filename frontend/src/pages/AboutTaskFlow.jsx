import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Section = ({ icon, title, children, accent = '#6366f1' }) => (
  <div style={{ marginBottom: '4rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}20`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700 }}>{title}</h2>
    </div>
    {children}
  </div>
);

const FeatureCard = ({ icon, title, desc, color = '#6366f1' }) => (
  <div className="card" style={{ padding: '1.5rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = `${color}44`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: '1rem' }}>{icon}</div>
    <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{desc}</div>
  </div>
);

const ValueCard = ({ icon, title, text, color }) => (
  <div style={{ padding: '1.5rem', borderRadius: 'var(--r-lg)', background: `${color}08`, border: `1px solid ${color}20`, transition: 'all 0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}>
    <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>{icon}</div>
    <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{text}</div>
  </div>
);

const StatPill = ({ num, label, color }) => (
  <div style={{ textAlign: 'center', padding: '1.5rem', borderRadius: 'var(--r-lg)', background: `${color}10`, border: `1px solid ${color}25` }}>
    <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, fontWeight: 700, color }}>{num}</div>
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
  </div>
);

export default function AboutTaskFlow() {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    { icon: '🔐', title: 'Secure Auth', desc: 'JWT-based authentication with role-based access control. Admin and Member roles with granular permissions.', color: '#6366f1' },
    { icon: '📋', title: 'Task Management', desc: 'Create, assign, and track tasks with priority levels, due dates, and real-time status updates.', color: '#8b5cf6' },
    { icon: '📁', title: 'Project Spaces', desc: 'Organize work into dedicated project spaces with team members, progress tracking, and task filtering.', color: '#06b6d4' },
    { icon: '📊', title: 'Visual Dashboard', desc: 'Real-time charts and graphs including donut charts, bar charts, progress bars, and activity trends.', color: '#10b981' },
    { icon: '👥', title: 'Team Management', desc: 'Invite members, manage roles, view per-member task stats, and track individual progress.', color: '#f59e0b' },
    { icon: '📝', title: 'Smart Notes', desc: 'Rich note-taking with tags, file attachments, search, save/feed sections, and share functionality.', color: '#ec4899' },
    { icon: '✦ ', title: 'AI Assistant', desc: 'Integrated AI powered by Claude. Ask questions, upload documents, get intelligent project insights.', color: '#a78bfa' },
    { icon: '🎨', title: 'Themes', desc: 'Multiple visual themes: Dark, Light, and Midnight — switch anytime with the theme toggle.', color: '#34d399' },
  ];

  const values = [
    { icon: '🚀', title: 'Speed First',    text: 'Built for teams that move fast. Every interaction is optimized for zero friction.',                      color: '#6366f1' },
    { icon: '🔒', title: 'Trust & Safety', text: 'Role-based permissions ensure every team member only accesses what they should.',                       color: '#10b981' },
    { icon: '🌍', title: 'Openness',       text: 'Built with open standards, deployed on Railway, accessible from anywhere in the world.',               color: '#06b6d4' },
    { icon: '💡', title: 'Clarity',        text: 'Clean UI that makes complex team data instantly understandable through well-designed visualizations.',  color: '#f59e0b' },
    { icon: '🤝', title: 'Collaboration',  text: 'Every feature is designed with teams in mind — not just individuals.',                                 color: '#ec4899' },
    { icon: '⚡', title: 'Reliability',   text: 'PostgreSQL-backed persistence on Railway ensures your data is always safe and available.',             color: '#a78bfa' },
  ];

  const faqs = [
    { q: 'Is TaskFlow free to use?',                     a: 'TaskFlow is free for all users. The live deployment runs on Railway\'s free tier with PostgreSQL storage.' },
    { q: 'What is the difference between Admin and Member?', a: 'Admins can create projects, assign tasks, manage team members, and delete content. Members can view assigned tasks and update their own task progress only.' },
    { q: 'Who is the Developer role?',                   a: 'The Developer is the application creator (Yash Rajput). This special account has god-mode access — able to delete any project, task, or member across the platform.' },
    { q: 'Can I use TaskFlow on mobile?',                a: 'Yes! TaskFlow is a PWA (Progressive Web App). You can install it to your home screen on Android and iOS for a native-app experience.' },
    { q: 'How does the AI Assistant work?',              a: 'The AI section is powered by the Anthropic Claude API. You can ask questions, upload files/images, and get intelligent responses about project management, writing, and more.' },
    { q: 'Is my data safe?',                             a: 'All passwords are bcrypt-hashed. JWTs are used for session management. The database runs on Railway\'s managed PostgreSQL with daily backups.' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '4rem 0 3rem', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, fontWeight: 600, color: '#a5b4fc', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ⬡ About TaskFlow
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg,#eeeeff,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Where Teams Get<br />Things Done.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-2)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 2.5rem' }}>
          TaskFlow is a full-stack team task management platform built for modern teams who need structure, visibility, and speed — all in one beautiful interface.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '11px 24px', fontSize: 14 }}>Open App →</Link>
          <Link to="/developer" className="btn" style={{ padding: '11px 24px', fontSize: 14 }}>Meet the Builder</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: '4rem' }}>
        <StatPill num="8+"  label="Core Features"  color="#6366f1" />
        <StatPill num="3"   label="User Roles"      color="#10b981" />
        <StatPill num="∞"   label="Projects"        color="#06b6d4" />
        <StatPill num="AI"  label="Integrated"      color="#a78bfa" />
      </div>

      {/* Intro */}
      <Section icon="📖" title="What is TaskFlow?">
        <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.9, marginBottom: '1.5rem' }}>
          TaskFlow is a full-stack web application designed to help teams of any size manage their projects, track task progress, and collaborate efficiently. From the first line of code to a live Railway deployment, it was built as a complete production-grade system with real authentication, a real database, and a real-time dashboard.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['🔧 Built With', 'React, Node.js, Express, PostgreSQL, JWT'], ['🚀 Deployed On', 'Railway — live, always-on cloud infrastructure'], ['🎨 Designed For', 'Speed, clarity, and modern dark aesthetics'], ['🔐 Secured With', 'bcryptjs passwords, JWT sessions, RBAC']].map(([t, v]) => (
            <div key={t} style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Core Features */}
      <Section icon="⚡" title="Core Features" accent="#8b5cf6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </Section>

      {/* Our Story */}
      <Section icon="📜" title="Our Story" accent="#06b6d4">
        <div style={{ padding: '2rem', borderRadius: 'var(--r-xl)', background: 'linear-gradient(135deg,rgba(6,182,212,0.06),rgba(99,102,241,0.06))', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 2, marginBottom: '1rem' }}>
            TaskFlow was born from a simple frustration — existing task management tools were either too complex, too expensive, or too ugly for small teams to actually enjoy using.
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 2, marginBottom: '1rem' }}>
            Yash Rajput, a full-stack developer from India, set out to build something different: a task manager that looks stunning, loads fast, and gives teams exactly the features they need — no more, no less.
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 2 }}>
            What started as an assignment became a complete, production-ready platform with AI integration, theme switching, rich notes, and a real-time dashboard. TaskFlow continues to evolve based on real team feedback.
          </p>
        </div>
      </Section>

      {/* Values */}
      <Section icon="💎" title="Our Values" accent="#10b981">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {values.map(v => <ValueCard key={v.title} {...v} />)}
        </div>
      </Section>

      {/* How it Works */}
      <Section icon="🗺" title="How It Works" accent="#f59e0b">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '01', title: 'Sign Up',          desc: 'Create your account and choose your role — Admin for full control, Member for focused task work.', color: '#6366f1' },
            { step: '02', title: 'Create a Project', desc: 'Admins create projects, add team members, and define the scope of work.', color: '#8b5cf6' },
            { step: '03', title: 'Add Tasks',        desc: 'Break projects into tasks with priorities, due dates, and assigned team members.', color: '#06b6d4' },
            { step: '04', title: 'Track Progress',   desc: 'The dashboard updates in real-time with charts, completion rates, and overdue alerts.', color: '#10b981' },
            { step: '05', title: 'Ship It',          desc: 'Mark tasks done, celebrate completions, and move on to the next challenge.', color: '#f59e0b' },
          ].map((item, i) => (
            <div key={item.step} style={{ display: 'flex', gap: 20, padding: '1.5rem 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${item.color}18`, border: `2px solid ${item.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 13, color: item.color, flexShrink: 0 }}>{item.step}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section icon="❓" title="Frequently Asked Questions" accent="#ec4899">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'border-color 0.2s', borderColor: openFaq === i ? 'rgba(99,102,241,0.3)' : 'var(--border)' }}>
              <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', background: openFaq === i ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{faq.q}</span>
                <span style={{ color: 'var(--text-3)', transition: 'transform 0.2s', display: 'inline-block', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </div>
              {openFaq === i && <div style={{ padding: '0 1.25rem 1rem', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '3rem', borderRadius: 'var(--r-xl)', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 700, marginBottom: '1rem' }}>Ready to get started?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: '1.5rem' }}>Join TaskFlow and take your team's productivity to the next level.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '11px 28px', fontSize: 14 }}>Get Started Free →</Link>
          <Link to="/developer" className="btn" style={{ padding: '11px 28px', fontSize: 14 }}>Meet the Developer</Link>
        </div>
      </div>
    </div>
  );
}
