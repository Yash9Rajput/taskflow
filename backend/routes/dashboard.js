const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard  — returns summary stats for the current user
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const isAdmin = req.user.role === 'admin';

  const taskFilter = isAdmin ? '' : 'AND (t.assignee_id = ? OR t.created_by = ?)';
  const taskParams = isAdmin ? [] : [req.user.id, req.user.id];

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status != 'done' AND due_date < date('now') THEN 1 ELSE 0 END) as overdue
    FROM tasks t WHERE 1=1 ${taskFilter}
  `).get(...taskParams);

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE 1=1 ${taskFilter}
    ORDER BY t.due_date ASC, t.created_at DESC
    LIMIT 10
  `).all(...taskParams);

  const projects = db.prepare(isAdmin
    ? 'SELECT * FROM projects ORDER BY created_at DESC'
    : `SELECT p.* FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ? ORDER BY p.created_at DESC`
  ).all(...(isAdmin ? [] : [req.user.id]));

  const projectsWithStats = projects.map(p => {
    const ts = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done
      FROM tasks WHERE project_id = ?
    `).get(p.id);
    return { ...p, total_tasks: ts.total, done_tasks: ts.done };
  });

  res.json({ stats, recent_tasks: recentTasks, projects: projectsWithStats });
});

module.exports = router;
