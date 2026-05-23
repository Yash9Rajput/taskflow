const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user.role === 'admin';

    const taskFilter = isAdmin ? '' : 'AND (t.assignee_id = $1 OR t.created_by = $2)';
    const taskParams = isAdmin ? [] : [req.user.id, req.user.id];

    const statsSQL = `
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status != 'done' AND due_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
      FROM tasks t WHERE 1=1 ${taskFilter}
    `;
    const stats = await db.prepare(statsSQL).get(...taskParams);

    const recentSQL = `
      SELECT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE 1=1 ${taskFilter}
      ORDER BY t.due_date ASC, t.created_at DESC
      LIMIT 10
    `;
    const recentTasks = await db.prepare(recentSQL).all(...taskParams);

    let projects;
    if (isAdmin) {
      projects = await db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    } else {
      projects = await db.prepare(`
        SELECT p.* FROM projects p
        INNER JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = ? ORDER BY p.created_at DESC
      `).all(req.user.id);
    }

    const projectsWithStats = await Promise.all(projects.map(async p => {
      const ts = await db.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done
        FROM tasks WHERE project_id = ?
      `).get(p.id);
      return { ...p, total_tasks: ts.total, done_tasks: ts.done };
    }));

    res.json({ stats, recent_tasks: recentTasks, projects: projectsWithStats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
