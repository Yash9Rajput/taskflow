import React from 'react';

export function Spinner() { return <div className="spinner" />; }

export function Empty({ message = 'Nothing here yet.' }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">◫</span>
      {message}
    </div>
  );
}

const PALETTES = [
  ['#6366f1','#c7d2fe'],['#8b5cf6','#ddd6fe'],['#06b6d4','#cffafe'],
  ['#10b981','#a7f3d0'],['#f59e0b','#fde68a'],['#ec4899','#fbcfe8'],
  ['#ef4444','#fecaca'],['#14b8a6','#99f6e4'],['#f97316','#fed7aa'],
];
function palette(name='') { return PALETTES[name.charCodeAt(0)%PALETTES.length]; }

export function Avatar({ user, size=32 }) {
  const name = user?.name||'?';
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const [accent] = palette(name);
  return (
    <div className="avatar" style={{width:size,height:size,fontSize:size*0.36,background:accent+'1a',color:accent,border:`1.5px solid ${accent}33`}}>
      {initials}
    </div>
  );
}

export function Badge({ status, priority, role }) {
  if (role)     return <span className={`badge badge-${role}`}>{role==='admin'?'👑 ':''}{role}</span>;
  if (priority) return <span className={`badge badge-${priority}`}>{priority}</span>;
  const map   = {todo:'todo','in-progress':'progress',done:'done',overdue:'overdue'};
  const label = {todo:'To Do','in-progress':'In Progress',done:'Done',overdue:'Overdue'};
  const dot   = {todo:'#818cf8','in-progress':'#fbbf24',done:'#34d399',overdue:'#f87171'};
  return (
    <span className={`badge badge-${map[status]||'todo'}`}>
      <span style={{width:5,height:5,borderRadius:'50%',background:dot[status],display:'inline-block',flexShrink:0}}/>
      {label[status]||status}
    </span>
  );
}

export function ProgressBar({ value=0, max=1, color }) {
  const pct = max ? Math.round((value/max)*100) : 0;
  return (
    <div className="progress-bg">
      <div className="progress-fill" style={{width:`${pct}%`,background:color||undefined}} />
    </div>
  );
}

export function StatCard({ label, value, color, icon, lineClass='stat-line-purple', sub }) {
  return (
    <div className={`stat-card ${lineClass} au`}>
      {icon && (
        <div className="stat-icon-bg" style={{background:color?`${color}18`:'rgba(99,102,241,0.12)'}}>
          <span style={{fontSize:18}}>{icon}</span>
        </div>
      )}
      <div className="stat-num" style={{color:color||'var(--text)'}}>{value??0}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>{sub}</div>}
    </div>
  );
}

export function Button({ children, variant, className='', ...props }) {
  const cls = `btn${variant==='primary'?' btn-primary':variant==='danger'?' btn-danger':''} ${className}`;
  return <button className={cls} {...props}>{children}</button>;
}

export function Field({ label, children }) {
  return <div className="field">{label&&<label>{label}</label>}{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
          <div style={{fontFamily:'var(--font-d)',fontSize:17,fontWeight:600}}>{title}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{padding:'4px 8px',fontSize:15,lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function taskStatusDisplay(task) {
  if (task.status==='done') return 'done';
  if (task.due_date && new Date(task.due_date)<new Date()) return 'overdue';
  return task.status;
}

/* ── Donut Chart ── */
export function DonutChart({ segments, size=120, thickness=16 }) {
  const r = (size-thickness)/2;
  const circ = 2*Math.PI*r;
  const total = segments.reduce((s,x)=>s+x.value,0)||1;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',display:'block'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness}/>
      {segments.map((seg,i)=>{
        const dash=(seg.value/total)*circ, gap=circ-dash;
        const el=(
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{transition:'stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)'}}
          />
        );
        offset+=dash+2;
        return el;
      })}
    </svg>
  );
}

/* ── Horizontal Bar Chart ── */
export function BarChart({ bars, showPercent=false }) {
  const max = Math.max(...bars.map(b=>b.value),1);
  return (
    <div className="barchart-wrap">
      {bars.map((b,i)=>(
        <div key={i} className="barchart-row">
          <div className="barchart-label" title={b.label}>{b.label}</div>
          <div className="barchart-bg">
            <div className="barchart-fill" style={{width:`${(b.value/max)*100}%`,background:b.color||'var(--grad)'}}/>
          </div>
          <div className="barchart-val">{showPercent?`${Math.round((b.value/max)*100)}%`:b.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Sparkline ── */
export function Sparkline({ data=[], color='var(--accent)', height=24 }) {
  const max = Math.max(...data,1);
  return (
    <div className="sparkline" style={{height}}>
      {data.map((v,i)=>(
        <div key={i} className="spark-bar" style={{height:`${Math.max(15,(v/max)*100)}%`,background:color,opacity:0.5+0.5*(v/max)}}/>
      ))}
    </div>
  );
}

/* ── Stacked bar ── */
export function StackedBar({ segments, height=10 }) {
  const total = segments.reduce((s,x)=>s+x.value,0)||1;
  return (
    <div style={{display:'flex',borderRadius:999,overflow:'hidden',height,background:'rgba(255,255,255,0.05)'}}>
      {segments.map((s,i)=>(
        <div key={i} title={`${s.label}: ${s.value}`}
          style={{width:`${(s.value/total)*100}%`,background:s.color,transition:'width 0.9s ease'}}/>
      ))}
    </div>
  );
}

/* ── Activity heatmap ── */
export function Heatmap({ days=35, data={} }) {
  const today = new Date();
  const cells = Array.from({length:days},(_,i)=>{
    const d=new Date(today); d.setDate(d.getDate()-(days-1-i));
    const key=d.toISOString().slice(0,10);
    return {key,val:data[key]||0};
  });
  const maxVal = Math.max(...cells.map(c=>c.val),1);
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
      {cells.map((c,i)=>(
        <div key={i} title={`${c.key}: ${c.val}`} className="tooltip" data-tip={`${c.key}: ${c.val} tasks`}
          style={{width:10,height:10,borderRadius:2,background:c.val===0?'rgba(255,255,255,0.05)':`rgba(99,102,241,${0.15+0.85*(c.val/maxVal)})`}}/>
      ))}
    </div>
  );
}

/* ── Ticker ── */
export function Ticker({ items=[] }) {
  const doubled = [...items,...items];
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {doubled.map((item,i)=>(
          <div key={i} className="ticker-item">
            <span style={{color:item.color||'var(--accent)'}}>{item.icon}</span> {item.label}
            <span style={{color:'var(--border-hi)',margin:'0 8px'}}>·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
