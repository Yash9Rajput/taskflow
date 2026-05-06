import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { StatCard, Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay, DonutChart, BarChart, MiniHeatmap } from '../components/UI';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner /></div>;
  if (!data)   return <Empty message="Could not load dashboard." />;

  const { stats, recent_tasks = [], projects = [] } = data;
  const total = stats.total_tasks || 0;

  const donutSegs = [
    { value: stats.done || 0,        color: '#10b981', label: 'Done' },
    { value: stats.in_progress || 0, color: '#6366f1', label: 'In Progress' },
    { value: stats.overdue || 0,     color: '#ef4444', label: 'Overdue' },
    { value: Math.max(0,(stats.total_tasks||0) - (stats.done||0) - (stats.in_progress||0) - (stats.overdue||0)), color: 'rgba(255,255,255,0.08)', label: 'To Do' },
  ].filter(s => s.value > 0);

  const barData = projects.slice(0,6).map(p => ({
    label: p.name.length > 12 ? p.name.slice(0,12)+'…' : p.name,
    value: p.done_tasks || 0,
    color: 'var(--gradient)',
  }));

  const priorityBars = [
    { label: 'High',   value: recent_tasks.filter(t=>t.priority==='high').length,   color: '#ef4444' },
    { label: 'Medium', value: recent_tasks.filter(t=>t.priority==='medium').length, color: '#f59e0b' },
    { label: 'Low',    value: recent_tasks.filter(t=>t.priority==='low').length,    color: '#10b981' },
  ];

  return (
    <div>
      <div className="page-bg" />
      <div style={{marginBottom:'2rem'}}>
        <h1 className="page-title animate-up" style={{marginBottom:4}}>Dashboard</h1>
        <p style={{color:'var(--text-secondary)',fontSize:14}} className="animate-up-1">Welcome back — here's what's happening</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{marginBottom:'1.5rem'}}>
        <StatCard label="Total Tasks"  value={stats.total_tasks} icon="📋" />
        <StatCard label="In Progress"  value={stats.in_progress} color="#818cf8" icon="⚡" />
        <StatCard label="Completed"    value={stats.done}        color="#34d399" icon="✓" />
        <StatCard label="Overdue"      value={stats.overdue}     color="#f87171" icon="⚠" />
      </div>

      <div className="grid-2" style={{marginBottom:'1.5rem'}}>
        {/* Donut chart */}
        <div className="card animate-up-2" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div className="section-title">Task Breakdown</div>
          </div>
          {total === 0 ? <Empty message="No tasks yet." /> : (
            <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
              <div className="donut-wrap">
                <DonutChart segments={donutSegs} size={140} thickness={20} />
                <div className="donut-center">
                  <div style={{fontSize:28,fontWeight:700,fontFamily:'var(--font-display)'}}>{total}</div>
                  <div style={{fontSize:11,color:'var(--text-secondary)'}}>Total</div>
                </div>
              </div>
              <div style={{flex:1}}>
                {[
                  {label:'Done',       val:stats.done||0,        color:'#10b981'},
                  {label:'In Progress',val:stats.in_progress||0, color:'#6366f1'},
                  {label:'Overdue',    val:stats.overdue||0,     color:'#ef4444'},
                  {label:'To Do',      val:Math.max(0,total-(stats.done||0)-(stats.in_progress||0)-(stats.overdue||0)), color:'rgba(255,255,255,0.3)'},
                ].map(item => (
                  <div key={item.label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:item.color,flexShrink:0}} />
                    <span style={{fontSize:13,color:'var(--text-secondary)',flex:1}}>{item.label}</span>
                    <span style={{fontSize:13,fontWeight:600}}>{item.val}</span>
                    <span style={{fontSize:11,color:'var(--text-muted)',width:32,textAlign:'right'}}>{total?Math.round(item.val/total*100):0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project progress bars */}
        <div className="card animate-up-3" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div className="section-title">Project Progress</div>
          </div>
          {projects.length === 0 ? <Empty message="No projects yet." /> : (
            <div>
              {projects.slice(0,5).map(p => {
                const pct = p.total_tasks ? Math.round(p.done_tasks/p.total_tasks*100) : 0;
                return (
                  <div key={p.id} style={{marginBottom:'1rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:500}}>{p.name}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,color:'var(--text-muted)'}}>{p.done_tasks}/{p.total_tasks}</span>
                        <span style={{fontSize:12,fontWeight:600,color:pct===100?'#34d399':pct>50?'#818cf8':'var(--text-secondary)'}}>{pct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={p.done_tasks} max={p.total_tasks} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:'1.5rem'}}>
        {/* Recent tasks */}
        <div className="card animate-up-4" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div className="section-title">Upcoming Tasks</div>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>{recent_tasks.length} tasks</span>
          </div>
          {recent_tasks.length === 0 ? <Empty message="No tasks yet." /> : recent_tasks.slice(0,6).map(t => (
            <div key={t.id} className="task-row">
              <Avatar user={{ id:t.assignee_id, name:t.assignee_name||'?' }} size={30} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{t.project_name} · {t.due_date||'No due date'}</div>
              </div>
              <Badge priority={t.priority} />
              <Badge status={taskStatusDisplay(t)} />
            </div>
          ))}
        </div>

        {/* Priority distribution + mini stats */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card animate-up-4" style={{padding:'1.5rem',flex:1}}>
            <div className="section-head">
              <div className="section-title">Priority Split</div>
            </div>
            <BarChart bars={priorityBars} />
          </div>
          <div className="card" style={{padding:'1.5rem'}}>
            <div className="section-title" style={{marginBottom:'1rem'}}>Completion Rate</div>
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:32,fontWeight:700,fontFamily:'var(--font-display)',color:total>0&&(stats.done/total)>0.7?'#34d399':'var(--text-primary)'}}>
                  {total ? Math.round((stats.done/total)*100) : 0}%
                </div>
                <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>Tasks completed</div>
              </div>
              <div style={{width:80,height:80,position:'relative'}}>
                <DonutChart segments={[
                  {value:stats.done||0, color:'#10b981'},
                  {value:Math.max(0,total-(stats.done||0)), color:'rgba(255,255,255,0.06)'},
                ]} size={80} thickness={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
