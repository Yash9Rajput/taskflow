import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Animated canvas background ─────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let W = canvas.width  = window.innerWidth / 2;
    let H = canvas.height = window.innerHeight;

    const onResize = () => {
      W = canvas.width  = window.innerWidth / 2;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Particles
    const count = 55;
    const particles = Array.from({ length: count }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 2 + 0.5,
      dx:   (Math.random() - 0.5) * 0.35,
      dy:   (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.5 + 0.15,
    }));

    // Orbs (large soft glows)
    const orbs = [
      { x: W * 0.25, y: H * 0.3,  r: 180, color: 'rgba(99,102,241,0.13)'  },
      { x: W * 0.75, y: H * 0.65, r: 220, color: 'rgba(139,92,246,0.10)'  },
      { x: W * 0.5,  y: H * 0.8,  r: 140, color: 'rgba(196,181,253,0.07)' },
    ];

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Animated orbs
      orbs.forEach((o, i) => {
        const ox = o.x + Math.sin(t + i * 1.2) * 30;
        const oy = o.y + Math.cos(t + i * 0.9) * 20;
        const g  = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, o.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Grid lines (very subtle)
      ctx.strokeStyle = 'rgba(99,102,241,0.04)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Particles + connections
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,180,252,${p.opacity})`;
        ctx.fill();
      });

      // Draw connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
      }}
    />
  );
}

/* ─── Feature pill ────────────────────────────────────────────────────────── */
function FeaturePill({ icon, text, delay }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      background: 'rgba(99,102,241,0.1)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 999,
      fontSize: 13, color: 'rgba(196,181,253,0.9)',
      animation: `fadeUp 0.6s ${delay}s both`,
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      {text}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ value, label, icon, delay }) {
  return (
    <div style={{
      flex: 1,
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      textAlign: 'center',
      animation: `fadeUp 0.6s ${delay}s both`,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(196,181,253,0.7)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

/* ─── Help Modal ──────────────────────────────────────────────────────────── */
function HelpModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: '2rem', width: 340, textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.1)', animation: 'scaleIn 0.25s' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>❓</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'white' }}>Help & Support</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>We're here to help</div>
        <a href="mailto:rajput.kyar@gmail.com"
          style={{ display: 'block', padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontWeight: 500, fontSize: 13, textDecoration: 'none', marginBottom: 10, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}>
          📧 rajput.kyar@gmail.com
        </a>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>Click to open your mail client</div>
        <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>Got it</button>
      </div>
    </div>
  );
}

/* ─── Main Login Component ────────────────────────────────────────────────── */
export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPwd, setShowPwd]  = useState(false);
  const [focused, setFocused]  = useState('');
  const [mounted, setMounted]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // Mount animation trigger
    setTimeout(() => setMounted(true), 50);

    // Google OAuth error handling
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const msgs = {
      google_cancelled:   'Google sign-in was cancelled.',
      google_token_failed:'Google sign-in failed. Please try again.',
      google_no_email:    'Could not retrieve email from Google.',
      google_server_error:'A server error occurred. Please try again.',
    };
    if (msgs[err]) setError(msgs[err]);
    if (err) window.history.replaceState({}, '', '/login');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const base = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'https://taskflow-xhwe.onrender.com';
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.92); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0px) rotate(0deg); }
          33%      { transform:translateY(-12px) rotate(1deg); }
          66%      { transform:translateY(-6px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:0.6; }
          100% { transform:scale(1.6); opacity:0; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes gradientShift {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        .login-input {
          width:100%; padding:13px 16px; border-radius:12px;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.1);
          color:white; font-size:14px; outline:none;
          transition:all 0.25s; box-sizing:border-box;
          font-family:var(--font-b);
        }
        .login-input::placeholder { color:rgba(255,255,255,0.25); }
        .login-input:focus {
          border-color:rgba(99,102,241,0.7);
          background:rgba(99,102,241,0.08);
          box-shadow:0 0 0 3px rgba(99,102,241,0.12);
        }
        .login-input:hover:not(:focus) {
          border-color:rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.07);
        }
        .google-btn {
          width:100%; padding:13px 16px; border-radius:12px;
          border:1.5px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.05);
          color:white; font-size:14px; font-weight:500;
          cursor:pointer; display:flex; align-items:center;
          justify-content:center; gap:10px; transition:all 0.25s;
          font-family:var(--font-b); position:relative; overflow:hidden;
        }
        .google-btn:hover {
          background:rgba(255,255,255,0.1);
          border-color:rgba(255,255,255,0.25);
          transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(0,0,0,0.3);
        }
        .google-btn:active { transform:translateY(0); }
        .sign-btn {
          width:100%; padding:13px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          background-size:200% 200%;
          color:white; font-size:15px; font-weight:700;
          cursor:pointer; transition:all 0.25s;
          font-family:var(--font-b); letter-spacing:0.3px;
          position:relative; overflow:hidden;
          box-shadow:0 4px 20px rgba(99,102,241,0.4);
          animation: gradientShift 3s ease infinite;
        }
        .sign-btn:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 8px 32px rgba(99,102,241,0.55);
        }
        .sign-btn:active:not(:disabled) { transform:translateY(0); }
        .sign-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        background: '#07070f',
        overflow: 'hidden',
      }}>

        {/* ── LEFT PANEL — animated brand showcase ───────────────────────── */}
        <div style={{
          flex: '0 0 50%', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '3rem',
          background: 'linear-gradient(135deg,#07070f 0%,#0f0f20 50%,#0a0a18 100%)',
          overflow: 'hidden',
        }}>
          <ParticleCanvas />

          {/* Content — above canvas */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, width: '100%' }}>

            {/* Logo mark */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: '2.5rem',
              animation: 'fadeUp 0.6s 0.1s both',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
                animation: 'float 5s ease-in-out infinite',
                position: 'relative',
              }}>
                {/* Pulse ring */}
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: 20,
                  border: '2px solid rgba(99,102,241,0.4)',
                  animation: 'pulse-ring 2s ease-out infinite',
                }}/>
                <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                  <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
                  <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
                  <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 800, color: 'white',
                  letterSpacing: '-0.5px',
                }}>TaskFlow</div>
                <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Team Mission Control</div>
              </div>
            </div>

            {/* Headline */}
            <div style={{
              fontFamily: 'var(--font-d)', fontSize: 40, fontWeight: 900,
              lineHeight: 1.15, marginBottom: '1rem', color: 'white',
              animation: 'fadeUp 0.6s 0.2s both',
            }}>
              Manage projects
              <br/>
              <span style={{
                background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd,#818cf8)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                animation: 'gradientShift 4s ease infinite',
              }}>without the chaos.</span>
            </div>

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
              marginBottom: '2rem',
              animation: 'fadeUp 0.6s 0.3s both',
            }}>
              One workspace for your entire team — tasks, projects, notes, and AI assistance, all in one elegant place.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '2.5rem' }}>
              <FeaturePill icon="⚡" text="Real-time updates" delay={0.4} />
              <FeaturePill icon="🤖" text="AI Assistant" delay={0.45} />
              <FeaturePill icon="📊" text="Visual analytics" delay={0.5} />
              <FeaturePill icon="🔐" text="Role-based access" delay={0.55} />
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: 12,
              animation: 'fadeUp 0.6s 0.6s both',
            }}>
              <StatCard value="10k+" label="Tasks done"   icon="✅" delay={0.65} />
              <StatCard value="500+"  label="Teams"        icon="👥" delay={0.7}  />
              <StatCard value="99.9%" label="Uptime"       icon="🚀" delay={0.75} />
            </div>

            {/* Testimonial */}
            <div style={{
              marginTop: '2rem', padding: '16px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, backdropFilter: 'blur(8px)',
              animation: 'fadeUp 0.6s 0.8s both',
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10 }}>
                "TaskFlow transformed how our team collaborates. Everything is finally in one place."
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'white', fontWeight: 700,
                }}>Y</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Yash Rajput</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Founder, TaskFlow</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 13 }}>★★★★★</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — login form ────────────────────────────────────── */}
        <div style={{
          flex: '0 0 50%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
          background: '#0b0b16',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle glow behind form */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',
            pointerEvents: 'none',
          }}/>

          {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

          <div style={{
            width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease',
          }}>

            {/* Form header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 999,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 12, color: '#a5b4fc', fontWeight: 500,
                marginBottom: '1rem',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }}/>
                Secure sign-in
              </div>
              <h1 style={{
                fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 800,
                color: 'white', lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.5px',
              }}>
                Welcome back 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Sign in to continue to your workspace.{' '}
                <Link to="/signup" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  New here?
                </Link>
              </p>
            </div>

            {/* Google button */}
            <button className="google-btn" onClick={handleGoogle} style={{ marginBottom: '1.25rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
            </div>

            {/* Form card */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '1.75rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <form onSubmit={handleSubmit} autoComplete="on">

                {/* Email field */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)', marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 15, color: focused === 'email' ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                      transition: 'color 0.2s', pointerEvents: 'none',
                    }}>✉</span>
                    <input
                      className="login-input"
                      type="email" name="email" autoComplete="email"
                      value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com" required
                      style={{ paddingLeft: 42 }}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{
                      fontSize: 12, fontWeight: 600,
                      color: 'rgba(255,255,255,0.6)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Password</label>
                    <Link to="/forgot-password" style={{
                      fontSize: 12, color: '#a5b4fc', fontWeight: 500, textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                    onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 15, color: focused === 'pwd' ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                      transition: 'color 0.2s', pointerEvents: 'none',
                    }}>🔒</span>
                    <input
                      className="login-input"
                      type={showPwd ? 'text' : 'password'}
                      name="password" autoComplete="current-password"
                      value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="Your password" required
                      style={{ paddingLeft: 42, paddingRight: 46 }}
                      onFocus={() => setFocused('pwd')}
                      onBlur={() => setFocused('')}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 4, lineHeight: 1,
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      title={showPwd ? 'Hide password' : 'Show password'}>
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5',
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* Submit */}
                <button className="sign-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}/>
                      Signing in…
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Sign in to TaskFlow
                      <span style={{ fontSize: 16 }}>→</span>
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Footer links */}
            <div style={{
              marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                No account?{' '}
                <Link to="/signup" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  Create one free
                </Link>
              </div>
              <button onClick={() => setShowHelp(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'var(--font-b)',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'color 0.2s', padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                ❓ Help & Support
              </button>
            </div>

            {/* Trust badges */}
            <div style={{
              marginTop: '1.75rem', display: 'flex', justifyContent: 'center',
              gap: 20, flexWrap: 'wrap',
            }}>
              {['🔐 End-to-end secure', '⚡ 99.9% uptime', '🌐 Works everywhere'].map(b => (
                <div key={b} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {b}
                </div>
              ))}
            </div>

            {/* Bottom credit */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              Built with ❤️ by <span style={{ color: 'rgba(165,180,252,0.5)' }}>Yash Rajput</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
