import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// Notes live in IndexedDB (hundreds of MB) instead of localStorage (~5 MB).
// Every note record carries its owner's userId, so each user only sees their own.
const DB_NAME = 'tf-notes-db';
const STORE   = 'notes';
const legacyKey  = (userId) => `tf-notes-v2-${userId}`;   // old localStorage location
const migratedKey = (userId) => `tf-notes-migrated-${userId}`;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB not available')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const st = req.result.createObjectStore(STORE, { keyPath: 'id' });
      st.createIndex('userId', 'userId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// Run one transaction; resolves when it has fully committed.
async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    let result;
    try { result = fn(t.objectStore(STORE)); } catch (e) { db.close(); reject(e); return; }
    t.oncomplete = () => { db.close(); resolve(result && 'result' in result ? result.result : undefined); };
    t.onerror = t.onabort = () => { db.close(); reject(t.error || new Error('Storage error')); };
  });
}

const putNote    = (userId, note) => withStore('readwrite', st => st.put({ ...note, userId }));
const deleteNote = (id)           => withStore('readwrite', st => st.delete(id));

async function loadNotes(userId) {
  // One-time move of notes from the old localStorage storage.
  try {
    const raw = localStorage.getItem(legacyKey(userId));
    if (raw && !localStorage.getItem(migratedKey(userId))) {
      const old = JSON.parse(raw) || [];
      const now = Date.now();
      await withStore('readwrite', st => {
        old.forEach((n, i) => st.put({ ...n, userId, createdAt: n.createdAt || now - i }));
      });
      localStorage.setItem(migratedKey(userId), '1');
      localStorage.removeItem(legacyKey(userId));
    }
  } catch { /* migration is best-effort; never block loading */ }

  const all = await withStore('readonly', st => st.index('userId').getAll(userId));
  return (all || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Ask the browser not to evict our data when disk space is low (best-effort).
const requestPersistence = () => { try { navigator.storage?.persist?.(); } catch {} };
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const MAX_PDF_BYTES  = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// data: URL -> Blob (synchronous, so window.open stays inside the click gesture)
function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Opening a data: URL in a new tab is blocked by browsers; a blob: URL works.
function openAttachment(dataUrl) {
  try {
    const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
    const w = window.open(url, '_blank');
    if (!w) alert('Your browser blocked the preview pop-up. Allow pop-ups for this site, or use Download.');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    alert('Could not open this attachment. Try Download instead.');
  }
}

// Downscale photos so many notes with images still fit comfortably.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

function NoteDetail({ note, onBack, onEdit, onDelete }) {
  const isPdf = !!note.imageUrl && note.imageUrl.startsWith('data:application/pdf');
  const pdfUrl = useMemo(() => {
    if (!isPdf) return null;
    try { return URL.createObjectURL(dataUrlToBlob(note.imageUrl)); } catch { return null; }
  }, [note.imageUrl, isPdf]);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const share = async () => {
    const shareText = `${note.title}\n\n${note.body}`;
    if (navigator.share) {
      const shareData = { title: note.title, text: shareText };
      // If there's an image attachment, try to share it as a file
      if (note.imageUrl && note.imageUrl.startsWith('data:')) {
        try {
          const res  = await fetch(note.imageUrl);
          const blob = await res.blob();
          const file = new File([blob], note.attachmentName || 'attachment', { type: blob.type });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ ...shareData, files: [file] });
            return;
          }
        } catch {}
      }
      navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Note copied to clipboard!');
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
          ← Back to Notes
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={share}>↗ Share</button>
        <button className="btn btn-sm" onClick={onEdit}>✎ Edit</button>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑 Delete</button>
      </div>
      <div className="card" style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {note.tags?.map(t => (
            <span key={t} style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#a5b4fc' }}>#{t}</span>
          ))}
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 700, marginBottom: '0.5rem' }}>{note.title}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span>✍️ {note.author}</span>
          <span>📅 {note.date}</span>
          {note.savedAt && <span>⭐ Saved</span>}
        </div>
        {note.imageUrl && (
          <div style={{ marginBottom: '1.5rem' }}>
            {note.imageUrl.startsWith('data:image') ? (
              <div>
                <img src={note.imageUrl} alt="attachment"
                  style={{ width: '100%', borderRadius: 'var(--r-md)', maxHeight: 350, objectFit: 'cover', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={note.imageUrl} download={note.attachmentName || 'attachment'}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, textDecoration: 'none', cursor: 'pointer' }}>
                    ⬇️ Download
                  </a>
                  <button onClick={() => openAttachment(note.imageUrl)}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer' }}>
                    🔍 Preview
                  </button>
                </div>
              </div>
            ) : note.imageUrl.startsWith('data:application/pdf') ? (
              <div style={{ marginBottom: 8 }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ fontSize: 40, marginBottom: 8, textAlign: 'center' }}>📄</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>{note.attachmentName || 'PDF Document'}</div>
                </div>
                {pdfUrl && (
                  <iframe title="PDF preview" src={pdfUrl}
                    style={{ width: '100%', height: 480, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: '#fff', marginBottom: 8 }} />
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <a href={note.imageUrl} download={note.attachmentName || 'document.pdf'}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, textDecoration: 'none' }}>
                    ⬇️ Download PDF
                  </a>
                  <button onClick={() => openAttachment(note.imageUrl)}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer' }}>
                    🔍 Open in new tab
                  </button>
                </div>
              </div>
            ) : note.imageUrl ? (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>📎</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{note.attachmentName || 'Attachment'}</div>
                </div>
                <a href={note.imageUrl} download={note.attachmentName || 'attachment'}
                  style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, textDecoration: 'none' }}>
                  ⬇️ Download
                </a>
              </div>
            ) : null}
          </div>
        )}
        <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{note.body}</div>
      </div>
    </div>
  );
}

function NoteForm({ initial, onSave, onCancel, userName }) {
  const [form, setForm] = useState(initial || { title: '', body: '', tags: '', imageUrl: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.type.startsWith('image/')) {
        setBusy(true);
        const dataUrl = await compressImage(file);
        setForm(f => ({ ...f, imageUrl: dataUrl, attachmentName: file.name }));
      } else if (file.type === 'application/pdf') {
        if (file.size > MAX_PDF_BYTES) { setError('PDF is too large (max 15 MB).'); return; }
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = ev => res(ev.target.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        setForm(f => ({ ...f, imageUrl: dataUrl, attachmentName: file.name }));
      } else {
        if (file.size > MAX_FILE_BYTES) { setError('File is too large (max 10 MB).'); return; }
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = ev => res(ev.target.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        setForm(f => ({ ...f, imageUrl: dataUrl, attachmentName: file.name }));
      }
    } catch {
      setError('Could not read that file. Try another one.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Please enter a title.'); return; }
    setError('');
    onSave({
      ...form,
      title: form.title.trim(),
      author: userName || 'Me',
      date: new Date().toISOString().slice(0, 10),
      tags: Array.isArray(form.tags)
        ? form.tags
        : (form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      attachmentName: form.attachmentName || '',
    }, setError);
  };

  return (
    <div style={{ animation: 'scaleIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn" onClick={onCancel}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>← Back</button>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 600 }}>{initial ? 'Edit Note' : 'New Note'}</h2>
      </div>
      <div className="card" style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <div className="field">
          <label>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Note title…" style={{ fontSize: 18, fontFamily: 'var(--font-d)', fontWeight: 600 }} autoFocus />
        </div>
        <div className="field">
          <label>Content</label>
          <textarea value={form.body} onChange={e => set('body', e.target.value)}
            placeholder="Write your note here…" style={{ minHeight: 300, lineHeight: 1.8, fontSize: 14 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="work, ideas, todo" />
          </div>
          <div className="field">
            <label>Attach Image / File</label>
            <input type="file" accept="image/*,application/pdf,.txt,.md,.csv" onChange={handleFile} style={{ padding: '6px' }} />
          </div>
        </div>
        {busy && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Processing file…</div>}
        {form.imageUrl && form.imageUrl.startsWith('data:image') && (
          <img src={form.imageUrl} alt="preview" style={{ width: '100%', borderRadius: 'var(--r-md)', marginBottom: '0.5rem', maxHeight: 200, objectFit: 'cover' }} />
        )}
        {form.imageUrl && !form.imageUrl.startsWith('data:image') && (
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-2)', marginBottom: '0.5rem' }}>
            📎 {form.attachmentName || 'Attachment'}
          </div>
        )}
        {form.imageUrl && (
          <button className="btn btn-sm" type="button" style={{ marginBottom: '1rem' }}
            onClick={() => setForm(f => ({ ...f, imageUrl: '', attachmentName: '' }))}>✕ Remove attachment</button>
        )}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-sm)', color: '#fca5a5', fontSize: 13, marginBottom: '0.75rem' }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>💾 Save Note</button>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { user } = useAuth();
  // Each user gets their own notes storage — completely isolated
  const userId = user?.id || 'guest';

  const [notes,   setNotes]   = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const [view,    setView]    = useState('feed');
  const [current, setCurrent] = useState(null);
  const [search,  setSearch]  = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load (and on first run, migrate) this user's notes whenever the user changes
  useEffect(() => {
    let cancelled = false;
    setLoaded(false); setLoadErr('');
    setView('feed'); setCurrent(null);
    requestPersistence();
    loadNotes(userId)
      .then(n => { if (!cancelled) { setNotes(n); setLoaded(true); } })
      .catch(() => { if (!cancelled) { setNotes([]); setLoaded(true); setLoadErr('Could not open browser storage for notes. Private/incognito mode can block it.'); } });
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = async (form, setFormError) => {
    const record = current
      ? { ...current, ...form }
      : { id: genId(), ...form, savedAt: false, createdAt: Date.now() };
    try {
      await putNote(userId, record);
    } catch {
      if (setFormError) setFormError('Could not save: browser storage is full or blocked. Remove the attachment or delete old notes, then try again.');
      return;
    }
    setNotes(prev => current ? prev.map(n => n.id === current.id ? record : n) : [record, ...prev]);
    setCurrent(null); setView('feed');
  };

  const handleDelete = async (id) => {
    try { await deleteNote(id); } catch { alert('Could not delete the note. Please try again.'); return; }
    setNotes(prev => prev.filter(n => n.id !== id));
    setDeleteConfirm(null);
    setView('feed'); setCurrent(null);
  };

  const toggleSave = async (id) => {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    const updated = { ...n, savedAt: !n.savedAt };
    try { await putNote(userId, updated); } catch { alert('Could not update the note.'); return; }
    setNotes(prev => prev.map(x => x.id === id ? updated : x));
  };

  if (view === 'new') return (
    <NoteForm userName={user?.name} onSave={handleSave} onCancel={() => setView('feed')} />
  );
  if (view === 'edit' && current) return (
    <NoteForm initial={{ ...current, tags: current.tags?.join(', ') }} userName={user?.name}
      onSave={handleSave} onCancel={() => setView('detail')} />
  );
  if (view === 'detail' && current) return (
    <>
      <NoteDetail
        note={current}
        onBack={() => { setView('feed'); setCurrent(null); }}
        onEdit={() => setView('edit')}
        onDelete={() => setDeleteConfirm(current)}
      />
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center', animation: 'scaleIn 0.2s' }}>
            <div style={{ fontSize: 44, marginBottom: '1rem' }}>🗑️</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete this note?</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              <strong>&ldquo;{deleteConfirm.title}&rdquo;</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will permanently delete this note. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ minWidth: 100 }}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} style={{ minWidth: 100 }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const displayNotes = notes.filter(n => {
    const q = search.toLowerCase();
    const m = !q || n.title.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q) || n.tags?.some(t => t.includes(q));
    return view === 'saved' ? (m && n.savedAt) : m;
  });

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Notes</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{notes.length} notes · {notes.filter(n => n.savedAt).length} saved</p>
        </div>
        <button className="btn btn-primary" onClick={() => setView('new')}>+ New Note</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="au1">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search notes…" style={{ flex: 1, minWidth: 200, maxWidth: 400, fontSize: 13 }} />
        <div className="tabs">
          <button className={`tab-btn${view === 'feed' ? ' active' : ''}`} onClick={() => setView('feed')}>📋 All Notes</button>
          <button className={`tab-btn${view === 'saved' ? ' active' : ''}`} onClick={() => setView('saved')}>⭐ Saved</button>
        </div>
      </div>

      {loadErr && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-sm)', color: '#fca5a5', fontSize: 13, marginBottom: '1rem' }}>⚠️ {loadErr}</div>
      )}
      {!loaded ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>Loading notes…</div>
      ) : displayNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>📝</div>
          <div>{view === 'saved' ? 'No saved notes yet. Star a note to save it.' : 'No notes yet. Create your first one!'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }} className="au2">
          {displayNotes.map(n => (
            <div key={n.id} className="card card-hover" style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative' }}
              onClick={() => { setCurrent(n); setView('detail'); }}>
              {n.imageUrl && n.imageUrl.startsWith('data:image') && (
                <img src={n.imageUrl} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 'var(--r-sm)', marginBottom: '0.75rem' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, flex: 1, paddingRight: '0.5rem' }}>{n.title}</h3>
                <button onClick={e => { e.stopPropagation(); toggleSave(n.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: n.savedAt ? 1 : 0.3, transition: 'opacity 0.2s' }}>⭐</button>
              </div>
              {n.imageUrl && !n.imageUrl.startsWith('data:image') && (
                <div style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 6 }}>📎 {n.attachmentName || 'Attachment'}</div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {n.body || 'No content.'}
              </p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {n.tags?.map(t => (
                  <span key={t} style={{ padding: '1px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 10, color: '#a5b4fc' }}>#{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                <span>📅 {n.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
