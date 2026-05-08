import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'tf-notes-v1';
const loadNotes = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } };
const saveNotes = (n) => localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2);

function NoteDetail({ note, onBack, onEdit, onDelete }) {
  const share = () => {
    if (navigator.share) {
      navigator.share({ title: note.title, text: note.body }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(`${note.title}\n\n${note.body}`);
      alert('Note copied to clipboard!');
    }
  };
  return (
    <div style={{animation:'fadeUp 0.35s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
        <button className="btn" onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#a5b4fc'}}>
          ← Back to Notes
        </button>
        <div style={{flex:1}}/>
        <button className="btn btn-sm" onClick={share}>↗ Share</button>
        <button className="btn btn-sm" onClick={onEdit}>✎ Edit</button>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑 Delete</button>
      </div>
      <div className="card" style={{padding:'2rem',maxWidth:720,margin:'0 auto'}}>
        <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
          {note.tags?.map(t=><span key={t} style={{padding:'2px 10px',borderRadius:999,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',fontSize:11,color:'#a5b4fc'}}>#{t}</span>)}
        </div>
        <h1 style={{fontFamily:'var(--font-d)',fontSize:26,fontWeight:700,marginBottom:'0.5rem'}}>{note.title}</h1>
        <div style={{display:'flex',gap:16,fontSize:12,color:'var(--text-3)',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <span>✍️ {note.author}</span>
          <span>📅 {note.date}</span>
          {note.savedAt && <span>💾 Saved</span>}
        </div>
        {note.imageUrl && <img src={note.imageUrl} alt="attachment" style={{width:'100%',borderRadius:'var(--r-md)',marginBottom:'1.5rem',maxHeight:300,objectFit:'cover'}}/>}
        <div style={{fontSize:15,lineHeight:1.9,color:'var(--text-2)',whiteSpace:'pre-wrap',overflowY:'auto',maxHeight:500}}>{note.body}</div>
      </div>
    </div>
  );
}

function NoteForm({ initial, onSave, onCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initial || { title:'', body:'', tags:'', imageUrl:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('imageUrl', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      author: user?.name || 'Me',
      date: new Date().toISOString().slice(0,10),
      tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div style={{animation:'scaleIn 0.3s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
        <button className="btn" onClick={onCancel} style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#a5b4fc'}}>← Back</button>
        <h2 style={{fontFamily:'var(--font-d)',fontSize:20,fontWeight:600}}>{initial?'Edit Note':'New Note'}</h2>
      </div>
      <div className="card" style={{padding:'2rem',maxWidth:720,margin:'0 auto'}}>
        <div className="field"><label>Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Note title…" style={{fontSize:18,fontFamily:'var(--font-d)',fontWeight:600}}/></div>
        <div className="field"><label>Content</label><textarea value={form.body} onChange={e=>set('body',e.target.value)} placeholder="Write your note here…" style={{minHeight:300,lineHeight:1.8,fontSize:14}}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="field"><label>Tags (comma separated)</label><input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="work, ideas, todo"/></div>
          <div className="field">
            <label>Attach Image / File</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFile} style={{padding:'6px'}}/>
          </div>
        </div>
        {form.imageUrl && form.imageUrl.startsWith('data:image') && (
          <img src={form.imageUrl} alt="preview" style={{width:'100%',borderRadius:'var(--r-md)',marginBottom:'1rem',maxHeight:200,objectFit:'cover'}}/>
        )}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'0.5rem'}}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Save Note</button>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { user } = useAuth();
  const [notes,   setNotes]   = useState(() => loadNotes());
  const [view,    setView]    = useState('feed'); // 'feed' | 'saved' | 'detail' | 'new' | 'edit'
  const [current, setCurrent] = useState(null);
  const [search,  setSearch]  = useState('');

  const persist = (n) => { setNotes(n); saveNotes(n); };

  const handleSave = (form) => {
    if (current) {
      persist(notes.map(n => n.id===current.id ? {...n,...form} : n));
    } else {
      persist([{id:genId(),...form,savedAt:false}, ...notes]);
    }
    setCurrent(null); setView('feed');
  };

  const handleDelete = (id) => {
    persist(notes.filter(n=>n.id!==id));
    setView('feed'); setCurrent(null);
  };

  const toggleSave = (id) => persist(notes.map(n=>n.id===id?{...n,savedAt:!n.savedAt}:n));

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    const match = !q || n.title.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q) || n.tags?.some(t=>t.includes(q));
    const inFeed  = view==='feed'  ? match : false;
    const inSaved = view==='saved' ? (match && n.savedAt) : false;
    return inFeed || inSaved || view==='feed' && match;
  }).filter(n => view==='saved' ? n.savedAt : true);

  if (view==='new') return <NoteForm onSave={handleSave} onCancel={()=>setView('feed')}/>;
  if (view==='edit' && current) return <NoteForm initial={{...current,tags:current.tags?.join(', ')}} onSave={handleSave} onCancel={()=>setView('detail')}/>;
  if (view==='detail' && current) return (
    <NoteDetail note={current} onBack={()=>{setView('feed');setCurrent(null);}}
      onEdit={()=>setView('edit')}
      onDelete={()=>handleDelete(current.id)}/>
  );

  const displayNotes = notes.filter(n=>{
    const q = search.toLowerCase();
    const m = !q || n.title.toLowerCase().includes(q)||n.body?.toLowerCase().includes(q)||n.tags?.some(t=>t.includes(q));
    return view==='saved'?(m&&n.savedAt):m;
  });

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Notes</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{notes.length} notes · {notes.filter(n=>n.savedAt).length} saved</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setView('new')}>+ New Note</button>
      </div>

      {/* Search + tabs */}
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap'}} className="au1">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search notes by title, content, tag…" style={{flex:1,minWidth:200,maxWidth:400,fontSize:13}}/>
        <div className="tabs">
          <button className={`tab-btn${view==='feed'?' active':''}`} onClick={()=>setView('feed')}>📋 All Notes</button>
          <button className={`tab-btn${view==='saved'?' active':''}`} onClick={()=>setView('saved')}>⭐ Saved</button>
        </div>
      </div>

      {displayNotes.length===0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'var(--text-3)'}}>
          <div style={{fontSize:48,marginBottom:'1rem'}}>📝</div>
          <div>{view==='saved'?'No saved notes yet. Star a note to save it.':'No notes yet. Create your first one!'}</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}} className="au2">
          {displayNotes.map(n => (
            <div key={n.id} className="card card-hover" style={{padding:'1.25rem',cursor:'pointer',position:'relative'}}
              onClick={()=>{setCurrent(n);setView('detail');}}>
              {n.imageUrl&&n.imageUrl.startsWith('data:image')&&<img src={n.imageUrl} alt="" style={{width:'100%',height:130,objectFit:'cover',borderRadius:'var(--r-sm)',marginBottom:'0.75rem'}}/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <h3 style={{fontFamily:'var(--font-d)',fontSize:15,fontWeight:600,flex:1,paddingRight:'0.5rem'}}>{n.title}</h3>
                <button onClick={e=>{e.stopPropagation();toggleSave(n.id);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,opacity:n.savedAt?1:0.3,transition:'opacity 0.2s'}}>⭐</button>
              </div>
              <p style={{fontSize:12,color:'var(--text-3)',lineHeight:1.6,marginBottom:'0.75rem',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                {n.body||'No content.'}
              </p>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:'0.75rem'}}>
                {n.tags?.map(t=><span key={t} style={{padding:'1px 8px',borderRadius:999,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.15)',fontSize:10,color:'#a5b4fc'}}>#{t}</span>)}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)'}}>
                <span>✍️ {n.author}</span><span>📅 {n.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
