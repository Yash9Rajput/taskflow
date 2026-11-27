import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner } from '../components/UI';
import useMyProfile from '../components/useMyProfile';

const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Germany','France','Singapore','United Arab Emirates','Nepal','Bangladesh','Sri Lanka','Pakistan','Japan','China','Netherlands','Ireland','Sweden','Switzerland','New Zealand','South Africa','Brazil','Other'];
const DEGREES   = ['Bachelor of Technology','Bachelor of Engineering','Bachelor of Science','Bachelor of Computer Applications','Master of Technology','Master of Science','Master of Computer Applications','MBA','Diploma','Other'];
const BRANCHES  = ['Computer Science','Information Technology','Electronics & Communication','Electrical Engineering','Mechanical Engineering','Civil Engineering','Data Science','Artificial Intelligence','Other'];
const YEARS     = Array.from({ length: 16 }, (_, i) => String(2020 + i));

const TABS = [
  { id: 'basic',      icon: '👤', label: 'Basic Info' },
  { id: 'details',    icon: '🛠', label: 'Skills & Links' },
  { id: 'visibility', icon: '🔒', label: 'Visibility' },
];

const Label = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>
    {children}{required && <span style={{ color: '#f87171' }}> *</span>}
  </label>
);

// Centre-crop to a square and shrink to a small JPEG (fits the database comfortably).
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const tryEncode = (size, quality) => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        return c.toDataURL('image/jpeg', quality);
      };
      let out = tryEncode(256, 0.85);
      if (out.length > 85000) out = tryEncode(256, 0.7);
      if (out.length > 85000) out = tryEncode(192, 0.7);
      URL.revokeObjectURL(url);
      out.length > 85000 ? reject(new Error('Photo is too complex. Try a different image.')) : resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image. Use a PNG, JPG or WebP file.')); };
    img.src = url;
  });
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { profile, loading, error: loadError, reload } = useMyProfile();

  const [tab, setTab]       = useState('basic');
  const [form, setForm]     = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);       // {type:'ok'|'err', text}
  const [photoBusy, setPhotoBusy] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    const parts = (profile.name || '').trim().split(/\s+/);
    setForm({
      first: parts[0] || '', last: parts.slice(1).join(' '),
      bio: profile.bio, country: profile.country, college: profile.college,
      degree: profile.degree, branch: profile.branch, grad_year: profile.grad_year,
      skills: profile.skills, github: profile.github, linkedin: profile.linkedin, website: profile.website,
      handle: profile.handle, card_public: profile.card_public,
    });
    setAvatar(profile.avatar);
  }, [profile]);

  if (loading || (!form && !loadError)) return <Spinner />;
  if (loadError || !form) return (
    <div className="card" style={{ padding: '2rem', maxWidth: 520, margin: '3rem auto', textAlign: 'center' }}>
      <div style={{ marginBottom: 14, color: 'var(--text-2)' }}>⚠️ {loadError || 'Could not load your profile.'}</div>
      <button className="btn btn-primary" onClick={reload}>Try again</button>
    </div>
  );

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setMsg(null); };
  const errText = (e, fallback) => e?.response?.data?.error || e?.response?.data?.errors?.[0]?.msg || e?.message || fallback;

  // ── photo ──────────────────────────────────────────────────────────────────
  const onPickPhoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg({ type: 'err', text: 'Please choose an image file.' }); return; }
    setPhotoBusy(true); setMsg(null);
    try {
      const dataUrl = await fileToAvatar(file);
      await api.put('/users/me/avatar', { avatar: dataUrl });
      setAvatar(dataUrl);
      updateUser({ avatar: dataUrl });
      setMsg({ type: 'ok', text: 'Profile photo updated.' });
    } catch (err) { setMsg({ type: 'err', text: errText(err, 'Could not update your photo.') }); }
    finally { setPhotoBusy(false); }
  };

  const removePhoto = async () => {
    setPhotoBusy(true); setMsg(null);
    try {
      await api.put('/users/me/avatar', { avatar: null });
      setAvatar(null);
      updateUser({ avatar: null });
      setMsg({ type: 'ok', text: 'Profile photo removed.' });
    } catch (err) { setMsg({ type: 'err', text: errText(err, 'Could not remove your photo.') }); }
    finally { setPhotoBusy(false); }
  };

  // ── skills ─────────────────────────────────────────────────────────────────
  const addSkill = () => {
    const parts = skillInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...form.skills];
    parts.forEach(p => { if (next.length < 12 && !next.some(x => x.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 24)); });
    set('skills', next);
    setSkillInput('');
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.first.trim()) { setTab('basic'); setMsg({ type: 'err', text: 'First name is required.' }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        name: `${form.first.trim()} ${form.last.trim()}`.trim(),
        bio: form.bio, country: form.country, college: form.college, degree: form.degree,
        branch: form.branch, grad_year: form.grad_year, skills: form.skills,
        github: form.github, linkedin: form.linkedin, website: form.website,
        card_public: form.card_public ? 1 : 0, handle: form.handle,
      };
      const res = await api.put('/users/me/profile', payload);
      updateUser({ name: res.data.profile.name, handle: res.data.profile.handle });
      setMsg({ type: 'ok', text: 'Profile saved.' });
      reload();
    } catch (err) { setMsg({ type: 'err', text: errText(err, 'Could not save your profile.') }); }
    finally { setSaving(false); }
  };

  const select = (k, options, placeholder) => (
    <select value={form[k]} onChange={e => set(k, e.target.value)}>
      <option value="">{placeholder}</option>
      {[...new Set([...(form[k] && !options.includes(form[k]) ? [form[k]] : []), ...options])].map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const publicUrl = `${window.location.origin}/u/${form.handle || profile.handle}`;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px,230px) 1fr', gap: 20, alignItems: 'start' }} className="ep-grid">
        {/* sidebar */}
        <div className="card" style={{ padding: '0.75rem' }}>
          <button onClick={() => navigate('/profile')}
            style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-b)' }}>
            ← Back to Profile
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0 8px' }} />
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 3, borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 500,
                border: `1px solid ${tab === t.id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                background: tab === t.id ? 'rgba(99,102,241,0.14)' : 'transparent',
                color: tab === t.id ? '#c7d2fe' : 'var(--text-2)' }}>
              <span style={{ width: 20, textAlign: 'center' }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="card" style={{ padding: '1.75rem' }}>
          {tab === 'basic' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700 }}>Basic Info</h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.5rem' }}>You can manage your details here.</p>

              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0, opacity: photoBusy ? 0.5 : 1 }}>
                  <Avatar user={{ ...user, name: `${form.first} ${form.last}`.trim() || user?.name, avatar }} size={108} />
                  {avatar && (
                    <button onClick={removePhoto} disabled={photoBusy} title="Remove photo"
                      style={{ position: 'absolute', left: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--bg-card)', background: '#3b3b52', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  )}
                  <button onClick={() => fileRef.current?.click()} disabled={photoBusy} title="Change photo"
                    style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--bg-card)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✎</button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickPhoto} style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                    Click <strong>✎</strong> to upload a new photo{avatar ? <>, or <strong>✕</strong> to remove it</> : ''}.<br />
                    <span style={{ color: 'var(--text-3)' }}>PNG, JPG or WebP · it is cropped to a square automatically.</span>
                  </div>
                  {photoBusy && <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 6 }}>Uploading…</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ep-two">
                <div className="field"><Label required>First Name</Label><input value={form.first} onChange={e => set('first', e.target.value)} maxLength={40} /></div>
                <div className="field"><Label>Last Name</Label><input value={form.last} onChange={e => set('last', e.target.value)} maxLength={40} /></div>
              </div>
              <div className="field"><Label>Email</Label><input value={profile.email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} /></div>
              <div className="field">
                <Label>Bio (max 200 characters)</Label>
                <textarea value={form.bio} maxLength={200} onChange={e => set('bio', e.target.value)} placeholder="Turning logic into code and ideas into products…" style={{ minHeight: 90 }} />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{form.bio.length}/200</div>
              </div>
              <div className="field"><Label>Country</Label>{select('country', COUNTRIES, 'Select country')}</div>

              <div style={{ fontFamily: 'var(--font-d)', fontSize: 17, fontWeight: 600, margin: '1.5rem 0 1rem' }}>Educational Details</div>
              <div className="field"><Label>School / College / University</Label><input value={form.college} onChange={e => set('college', e.target.value)} maxLength={120} placeholder="e.g. Chandigarh University" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ep-two">
                <div className="field"><Label>Degree</Label>{select('degree', DEGREES, 'Select degree')}</div>
                <div className="field"><Label>Branch</Label>{select('branch', BRANCHES, 'Select branch')}</div>
              </div>
              <div className="field"><Label>Year of Graduation</Label>{select('grad_year', YEARS, 'Select year')}</div>
            </>
          )}

          {tab === 'details' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700 }}>Skills & Links</h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.5rem' }}>These appear on your profile and your shareable card.</p>

              <div className="field">
                <Label>Skills (up to 12)</Label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Type a skill and press Enter (e.g. React, Node.js)"
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }} />
                  <button className="btn" type="button" onClick={addSkill}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {form.skills.map(s => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>
                      #{s}
                      <button type="button" onClick={() => set('skills', form.skills.filter(x => x !== s))}
                        style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#c7d2fe', width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', fontSize: 10, lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                  {!form.skills.length && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No skills yet.</span>}
                </div>
              </div>
              <div className="field"><Label>GitHub</Label><input value={form.github} onChange={e => set('github', e.target.value)} placeholder="https://github.com/your-username" /></div>
              <div className="field"><Label>LinkedIn</Label><input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/your-name" /></div>
              <div className="field"><Label>Website / Portfolio</Label><input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://your-site.com" /></div>
            </>
          )}

          {tab === 'visibility' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700 }}>Visibility</h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.5rem' }}>Control who can open your Profile Card link.</p>

              <div onClick={() => set('card_public', !form.card_public)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: '1.25rem' }}>
                <div style={{ width: 42, height: 24, borderRadius: 999, background: form.card_public ? '#6366f1' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.card_public ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Public Profile Card</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {form.card_public ? 'Anyone with the link can see your card (name, photo, bio, skills, links and stats).' : 'Only you can see your card. Turn on to get a shareable link.'}
                  </div>
                </div>
              </div>

              <div className="field">
                <Label>Username</Label>
                <input value={form.handle} onChange={e => set('handle', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} maxLength={20} placeholder="your_username" />
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, wordBreak: 'break-all' }}>
                  3–20 letters, numbers or underscore. Your card link: <span style={{ color: form.card_public ? '#a5b4fc' : 'var(--text-3)' }}>{publicUrl}</span>
                </div>
              </div>
            </>
          )}

          {/* status + save */}
          {msg && (
            <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: 13,
              background: msg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'ok' ? '#34d399' : '#fca5a5' }}>
              {msg.type === 'ok' ? '✓ ' : '⚠ '}{msg.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button className="btn" onClick={() => navigate('/profile')}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</button>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 760px){ .ep-grid{grid-template-columns:1fr !important} .ep-two{grid-template-columns:1fr !important} }`}</style>
    </div>
  );
}
