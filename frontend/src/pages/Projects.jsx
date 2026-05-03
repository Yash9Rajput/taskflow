import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Button, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects]           = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [projectTasks, setProjectTasks]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tasksLoading, setTasksLoading]   = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [editProject, setEditProject]     = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask]           = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    projectsAPI.list().then(r => setProjects(r.data)).finally(() => setLoading(false));
  };

  const selectProject = (id) => {
    if (selectedId === id) { setSelectedId(null); setProjectTasks([]); return; }
    setSelectedId(id); setTasksLoading(true);
    tasksAPI.list({ project_id: id }).then(r => setProjectTasks(r.data)).finally(() => setTasksLoading(false));
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await projectsAPI.delete(id);
    if (selectedId === id) { setSelectedId(null); setProjectTasks([]); }
    load();
  };

  const handleDeleteTask = async (id) => {
    await tasksAPI.delete(id);
    setProjectTasks(pt => pt.filter(t => t.id !== id));
  };

  const selectedProject = projects.find(p => p.id === selectedId);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Projects</div>
        {isAdmin && <Button variant="primary" size="sm" onClick={() => { setEditProject(null); setShowProjModal(true); }}>+ New project</Button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {projects.length === 0 && <Empty message="No projects yet." />}
        {projects.map(p => {
          const pct = p.task_stats.total ? Math.round((p.task_stats.done / p.task_stats.total) * 100) : 0;
          return (
            <div key={p.id}
              onClick={() => selectProject(p.id)}
              style={{
                background: 'var(--color-background-primary)',
                border: selectedId === p.id ? '1.5px solid #185FA5' : '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>{p.description}</div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <Button size="sm" onClick={() => { setEditProject(p); setShowProjModal(true); }}>✎</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteProject(p.id)}>✕</Button>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {p.members?.slice(0, 5).map(m => <Avatar key={m.id} user={m} size={26} />)}
                  {p.members?.length > 5 && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>+{p.members.length - 5}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <span>{p.task_stats.total} tasks</span><span>{pct}%</span>
                </div>
                <ProgressBar value={p.task_stats.done} max={p.task_stats.total} />
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Tasks — {selectedProject.name}</span>
            {isAdmin && <Button variant="primary" size="sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ Add task</Button>}
          </div>
          {tasksLoading ? <Spinner /> : projectTasks.length === 0 ? <Empty message="No tasks in this project." /> :
            projectTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <Avatar user={t.assignee} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t.assignee?.name || 'Unassigned'} · due {t.due_date || '—'}</div>
                </div>
                <Badge priority={t.priority} />
                <Badge status={taskStatusDisplay(t)} />
                {isAdmin && (
                  <>
                    <Button size="sm" onClick={() => { setEditTask(t); setShowTaskModal(true); }}>✎</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteTask(t.id)}>✕</Button>
                  </>
                )}
              </div>
            ))
          }
        </div>
      )}

      {showProjModal && (
        <ProjectModal
          project={editProject}
          onClose={() => setShowProjModal(false)}
          onSaved={() => { load(); if (selectedId) { tasksAPI.list({ project_id: selectedId }).then(r => setProjectTasks(r.data)); } }}
        />
      )}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          defaultProjectId={selectedId}
          onClose={() => setShowTaskModal(false)}
          onSaved={(saved) => {
            if (saved.project_id === selectedId) {
              setProjectTasks(pt => editTask ? pt.map(t => t.id === saved.id ? saved : t) : [...pt, saved]);
            }
          }}
        />
      )}
    </div>
  );
}
