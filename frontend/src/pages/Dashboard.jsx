import React, { useState, useEffect } from 'react';
import { dashboardAPI, tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatCard, Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay,
         DonutChart, BarChart, StackedBar, Sparkline, Ticker } from '../components/UI';
import TaskDetailModal from '../components/TaskDetailModal';

const MOCK_SPARK = [2,5,3,8,6,9,7,4,8,11,6,10,9,12,8];

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewTask, setViewTask] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      import('../api').then(m => m.usersAPI.list()),
      projectsAPI.list(),
    ]).then(([d, u, p]) => {
      setData(d.data);
      setAllUsers(u.data);
      setProjects(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;
  if (!data)   return <Empty message="Could not load dashboard."/>;

  const { stats={}, recent_tasks=[], projects: projStats=[] } = data || {};
  const total     = parseInt(stats.total_tasks) || 0;
  const statsDone = parseInt(stats.done)        || 0;
  const statsIP   = parseInt(stats.in_progress) || 0;
  const statsOD   = parseInt(stats.overdue)     || 0;
  const todo      = Math.max(0, total - statsDone - statsIP - statsOD);

  const donutSegs = [
    {value:statsDone, color:'#10b981'},
    {value:statsIP,   color:'#6366f1'},
    {value:statsOD,   color:'#ef4444'},
    {value:todo,      color:'rgba(255,255,255,0.08)'},
  ].filter(s=>s.value>0);

  const priorityBars = [
    {label:'🔴 High',   value:recent_tasks.filter(t=>t.priority==='high').length,   color:'linear-gradient(90deg,#ef4444,#f97316)'},
    {label:'🟡 Medium', value:recent_tasks.filter(t=>t.priority==='medium').length, color:'linear-gradient(90deg,#f59e0b,#fbbf24)'},
    {label:'🟢 Low',    value:recent_tasks.filter(t=>t.priority==='low').length,    color:'linear-gradient(90deg,#10b981,#34d399)'},
  ];

  const projectBars = projStats.slice(0,6).map(p=>({
    label: p.name,
    value: p.total_tasks ? Math.round(p.done_tasks/p.total_tasks*100) : 0,
    color: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
  }));

  const tickerItems = [
    {icon:'✓', label:`${statsDone} Tasks Done`,    color:'#34d399'},
    {icon:'⚡', label:`${statsIP} Active`,          color:'#818cf8'},
    {icon:'⚠', label:`${statsOD} Overdue`,         color:'#f87171'},
    {icon:'◫', label:`${projStats.length} Projects`,color:'#67e8f9'},
    {icon:'%', label:`${total?Math.round((statsDone)/total*100):0}% Complete`, color:'#fcd34d'},
  ];

  const completionRate = total ? Math.round(((statsDone)/total)*100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:'1.5rem'}}>
        <h1 className="page-title au">Dashboard</h1>
        <p className="au1" style={{color:'var(--text-2)',fontSize:14}}>Real-time overview of your team's progress</p>
      </div>

      {/* Ticker — overflow-hidden so it never bleeds on mobile */}
      <div className="au1 ticker-wrap" style={{marginBottom:'1.25rem'}}>
        <Ticker items={tickerItems}/>
      </div>

      {/* Row 1: 4 stat cards */}
      <div className="grid-4 au2" style={{marginBottom:'1.5rem'}}>
        <StatCard label="Total Tasks"  value={total}     icon="📋" lineClass="stat-line-purple" sub={`${todo} to do`}/>
        <StatCard label="In Progress"  value={statsIP}   icon="⚡" color="#818cf8" lineClass="stat-line-purple" sub="active now"/>
        <StatCard label="Completed"    value={statsDone} icon="✓"  color="#34d399" lineClass="stat-line-green"  sub={`${completionRate}% rate`}/>
        <StatCard label="Overdue"      value={statsOD}   icon="⚠"  color="#f87171" lineClass="stat-line-red"    sub="need attention"/>
      </div>

      {/* Row 2: Donut + Project bars + Completion/Trend
          ↳ className="dash-3col" lets CSS collapse to 1 col on mobile
            without fighting inline style specificity */}
      <div className="dash-3col au3">
        {/* Donut — Task Status */}
        <div className="card" style={{padding:'1.5rem'}}>
          <div className="section-head" style={{marginBottom:'1rem'}}>
            <div className="section-title">Task Status</div>
          </div>
          {total===0 ? <Empty message="No tasks yet."/> : (
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}>
                <div className="donut-wrap">
                  <DonutChart segments={donutSegs} size={150} thickness={22}/>
                  <div className="donut-center">
                    <div style={{fontFamily:'var(--font-d)',fontSize:30,fontWeight:700}}>{total}</div>
                    <div style={{fontSize:10,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Tasks</div>
                  </div>
                </div>
              </div>
              {[
                {label:'Done',        val:statsDone, color:'#10b981'},
                {label:'In Progress', val:statsIP,   color:'#6366f1'},
                {label:'Overdue',     val:statsOD,   color:'#ef4444'},
                {label:'To Do',       val:todo,      color:'rgba(255,255,255,0.25)'},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:item.color,flexShrink:0}}/>
                  <span style={{fontSize:12,color:'var(--text-2)',flex:1}}>{item.label}</span>
                  <span style={{fontSize:12,fontWeight:600}}>{item.val}</span>
                  <span style={{fontSize:11,color:'var(--text-3)',width:30,textAlign:'right'}}>{total?Math.round(item.val/total*100):0}%</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Project completion bars */}
        <div className="card" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div className="section-title">Project Completion %</div>
            <span style={{fontSize:11,color:'var(--text-3)'}}>{projStats.length} projects</span>
          </div>
          {projStats.length===0 ? <Empty message="No projects."/> : (
            <>
              <BarChart bars={projectBars} showPercent/>
              <div style={{marginTop:'1.25rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Overall Stack</div>
                <StackedBar height={12} segments={[
                  {label:'Done',        value:statsDone, color:'#10b981'},
                  {label:'In Progress', value:statsIP,   color:'#6366f1'},
                  {label:'Overdue',     value:statsOD,   color:'#ef4444'},
                  {label:'To Do',       value:todo,      color:'rgba(255,255,255,0.08)'},
                ]}/>
              </div>
            </>
          )}
        </div>

        {/* Completion rate + activity trend */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:'1.5rem',flex:1}}>
            <div className="section-title" style={{marginBottom:'1.25rem'}}>Completion Rate</div>
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div>
                <div style={{fontFamily:'var(--font-d)',fontSize:40,fontWeight:700,lineHeight:1,
                  color:completionRate>=70?'#34d399':completionRate>=40?'#818cf8':'#f87171'}}>
                  {completionRate}%
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:6,textTransform:'uppercase',letterSpacing:'0.07em'}}>Overall</div>
              </div>
              <div style={{flex:1,display:'flex',justifyContent:'flex-end'}}>
                <DonutChart size={80} thickness={12} segments={[
                  {value:statsDone, color:'#10b981'},
                  {value:Math.max(0,total-statsDone), color:'rgba(255,255,255,0.05)'},
                ]}/>
              </div>
            </div>
          </div>
          <div className="card" style={{padding:'1.5rem',flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <div className="section-title" style={{fontSize:13}}>Activity Trend</div>
              <span style={{fontSize:10,color:'var(--text-3)'}}>14d</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:3,height:50}}>
              {MOCK_SPARK.map((v,i)=>{
                const mx=Math.max(...MOCK_SPARK);
                return <div key={i} style={{flex:1,borderRadius:'2px 2px 0 0',
                  background:`rgba(99,102,241,${0.25+0.75*(v/mx)})`,
                  height:`${(v/mx)*100}%`,transition:'height 0.8s ease',minHeight:3}}/>;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming tasks + Priority + Quick Stats */}
      <div className="grid-2 au4">
        {/* Upcoming tasks */}
        <div className="card" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div className="section-title">Upcoming Tasks</div>
            <span style={{fontSize:11,color:'var(--text-3)'}}>{recent_tasks.length} tasks</span>
          </div>
          {recent_tasks.length===0 ? <Empty message="No tasks yet."/> :
            recent_tasks.slice(0,7).map((t,i)=>(
              <React.Fragment key={t.id}>
                <div className="task-row" style={{cursor:'pointer'}} onClick={()=>setViewTask(t)}>
                  <Avatar user={{id:t.assignee_id, name:t.assignee_name||'?'}} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{t.project_name} · {t.due_date||'No date'}</div>
                  </div>
                  {/* Badges stack vertically on mobile via CSS */}
                  <div className="task-badges">
                    <Badge priority={t.priority}/>
                    <Badge status={taskStatusDisplay(t)}/>
                  </div>
                </div>
                {i<recent_tasks.length-1&&<div className="task-divider"/>}
              </React.Fragment>
            ))
          }
        </div>

        {/* Priority + Quick Stats */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:'1.5rem',flex:1}}>
            <div className="section-head">
              <div className="section-title">Priority Distribution</div>
            </div>
            <BarChart bars={priorityBars}/>
            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
              <StackedBar height={10} segments={[
                {label:'High',   value:priorityBars[0].value, color:'#ef4444'},
                {label:'Medium', value:priorityBars[1].value, color:'#f59e0b'},
                {label:'Low',    value:priorityBars[2].value, color:'#10b981'},
              ]}/>
            </div>
          </div>

          {/* Quick Stats — always 2×2 grid */}
          <div className="card" style={{padding:'1.5rem'}}>
            <div className="section-title" style={{marginBottom:'1rem'}}>Quick Stats</div>
            <div className="keep-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {label:'Projects',  val:projStats.length,                                 color:'#818cf8',icon:'◫'},
                {label:'Overdue',   val:statsOD,                                          color:'#f87171',icon:'⚠'},
                {label:'Done',      val:statsDone,                                        color:'#34d399',icon:'✓'},
                {label:'Assignees', val:new Set(recent_tasks.map(t=>t.assignee_id)).size, color:'#67e8f9',icon:'⊛'},
              ].map(s=>(
                <div key={s.label} style={{padding:'12px',background:'rgba(255,255,255,0.03)',
                  borderRadius:'var(--r-md)',border:'1px solid var(--border)',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-d)',color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.07em',marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {viewTask && (
        <TaskDetailModal
          task={viewTask}
          users={allUsers}
          projects={projects}
          onClose={()=>setViewTask(null)}
        />
      )}
    </div>
  );
}
