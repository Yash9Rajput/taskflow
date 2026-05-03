import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { StatCard, Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay } from '../components/UI';

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <Empty message="Could not load dashboard." />;

  const { stats, recent_tasks, projects } = data;

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: '1.25rem' }}>Dashboard</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Total tasks"  value={stats.total_tasks} />
        <StatCard label="In progress"  value={stats.in_progress} color="#185FA5" />
        <StatCard label="Completed"    value={stats.done}        color="#639922" />
        <StatCard label="Overdue"      value={stats.overdue}     color="#A32D2D" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Upcoming tasks */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>Upcoming tasks</div>
          {recent_tasks.length === 0 ? <Empty message="No tasks yet." /> : recent_tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <Avatar user={{ id: t.assignee_id, name: t.assignee_name || '?' }} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t.project_name} · due {t.due_date || '—'}</div>
              </div>
              <Badge status={taskStatusDisplay(t)} />
              <Badge priority={t.priority} />
            </div>
          ))}
        </div>

        {/* Projects overview */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>Projects overview</div>
          {projects.length === 0 ? <Empty message="No projects yet." /> : projects.map(p => (
            <div key={p.id} style={{ padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.done_tasks}/{p.total_tasks} done</span>
              </div>
              <ProgressBar value={p.done_tasks} max={p.total_tasks} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
