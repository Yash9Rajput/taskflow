import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import api from '../api';
import { Spinner } from '../components/UI';
import ProfileCardView from '../components/ProfileCardView';
import useMyProfile from '../components/useMyProfile';
import LinkRow, { copyText } from '../components/LinkRow';

export default function ProfileCard() {
  const navigate = useNavigate();
  const cardRef  = useRef(null);
  const { profile, setProfile, stats, loading, error, reload } = useMyProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [note, setNote]   = useState(null);   // {type, text}

  if (loading) return <Spinner />;
  if (error || !profile) return (
    <div className="card" style={{ padding: '2rem', maxWidth: 520, margin: '3rem auto', textAlign: 'center' }}>
      <div style={{ marginBottom: 14, color: 'var(--text-2)' }}>⚠️ {error || 'Could not load your profile.'}</div>
      <button className="btn btn-primary" onClick={reload}>Try again</button>
    </div>
  );

  const link = `${window.location.origin}/u/${profile.handle}`;
  const flash = (type, text) => { setNote({ type, text }); setTimeout(() => setNote(null), 3500); };

  const download = async (format) => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#07070f', scale: 3, useCORS: true, logging: false });
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const blob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
      if (!blob) throw new Error('Could not create the image');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-card-${profile.handle}.${format === 'jpg' ? 'jpg' : 'png'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      flash('ok', 'Card downloaded.');
    } catch (e) {
      flash('err', 'Could not download the card. Please try again.');
    } finally { setBusy(false); }
  };

  const makePublic = async () => {
    setBusy(true);
    try {
      const res = await api.put('/users/me/profile', { card_public: 1 });
      setProfile(res.data.profile);
      flash('ok', 'Your card is now public.');
    } catch (e) { flash('err', e?.response?.data?.error || 'Could not update visibility.'); }
    finally { setBusy(false); }
  };

  const needPublic = (m) => flash('err', typeof m === 'string' && m ? m : 'Make your card public first to get a shareable link.');

  const copyLink = async () => {
    if (!profile.card_public) return needPublic();
    const ok = await copyText(link);
    ok ? flash('ok', 'Link copied to clipboard.') : flash('err', `Copy failed. Your link: ${link}`);
  };
  // Real <a target="_blank"> links (below) are used for opening — pop-up blockers don't stop those.
  const guard = (e) => { if (!profile.card_public) { e.preventDefault(); needPublic(); } };
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;

  const iconBtn = { width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border-hi)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: 'pointer', fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
        <button className="btn" onClick={() => navigate('/profile')}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>← Back to Profile</button>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 600 }}>Profile Card</h2>
      </div>

      <div className="card pc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* preview */}
        <div style={{ padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 30%,rgba(99,102,241,0.12),transparent 70%)', borderRight: '1px solid var(--border)' }}>
          <ProfileCardView ref={cardRef} profile={profile} stats={stats} />
        </div>

        {/* share panel */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ fontSize: 56 }}>🪪</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Share your</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
              #Task<span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Flow</span>Card
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>with friends and recruiters</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-primary" onClick={() => setMenuOpen(o => !o)} disabled={busy} style={{ padding: '10px 18px' }}>
                {busy ? 'Working…' : 'Download'} <span style={{ fontSize: 9 }}>▼</span>
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 140, background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 20, overflow: 'hidden', textAlign: 'left' }}>
                  {[['png', 'PNG image'], ['jpg', 'JPG image']].map(([f, l]) => (
                    <div key={f} onClick={() => download(f)}
                      style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{l}</div>
                  ))}
                </div>
              )}
            </div>
            <button style={iconBtn} title="Copy link" onClick={copyLink}>🔗</button>
            <a style={{ ...iconBtn, textDecoration: 'none' }} title="Open public card in a new tab"
              href={link} target="_blank" rel="noopener noreferrer" onClick={guard}>↗</a>
          </div>

          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" onClick={guard} className="btn"
            style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff', padding: '9px 18px', fontWeight: 600, textDecoration: 'none' }}>
            <span style={{ fontWeight: 800 }}>in</span> Share on LinkedIn
          </a>

          {!profile.card_public && (
            <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, color: '#fcd34d', lineHeight: 1.6, maxWidth: 320 }}>
              🔒 Your card is private, so the link won’t work yet.
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-sm" onClick={makePublic} disabled={busy}>Make my card public</button>
              </div>
            </div>
          )}
          {profile.card_public && (
            <div style={{ width: '100%', maxWidth: 340 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Public link · hover for options</div>
              <LinkRow url={link} enabled onCopied={() => flash('ok', 'Link copied to clipboard.')} onBlocked={(m) => flash('err', m || 'Could not copy the link.')} />
            </div>
          )}

          {note && (
            <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12.5, background: note.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: note.type === 'ok' ? '#34d399' : '#fca5a5', border: `1px solid ${note.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{note.text}</div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile/edit')}>✎ Edit details on your card</button>
        </div>
      </div>
      <style>{`@media (max-width: 820px){ .pc-grid{grid-template-columns:1fr !important} .pc-grid > div:first-child{border-right:none !important;border-bottom:1px solid var(--border)} }`}</style>
    </div>
  );
}
