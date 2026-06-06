const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db     = getDb();
    const userId = req.user.id;

    // Same scoping for BOTH admin and member:
    // Only see tasks/projects where user is a project member, assignee, or creator
    const statsSQL = `
      SELECT
        COUNT(DISTINCT t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date::date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
      FROM tasks t
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE (t.assignee_id = ? OR t.created_by = ? OR pm.user_id = ?)
    `;

    const recentSQL = `
      SELECT DISTINCT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE (t.assignee_id = ? OR t.created_by = ? OR pm.user_id = ?)
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    // Only projects the user is actually a member of
    const projectsSQL = `
      SELECT DISTINCT p.* FROM projects p
      INNER JOIN project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `;

    const [stats, recentTasks, projects] = await Promise.all([
      db.prepare(statsSQL).get(userId, userId, userId),
      db.prepare(recentSQL).all(userId, userId, userId),
      db.prepare(projectsSQL).all(userId),
    ]);

    const projectsWithStats = await Promise.all(projects.map(async p => {
      const ts = await db.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done
        FROM tasks WHERE project_id = ?
      `).get(p.id);
      return { ...p, total_tasks: ts.total || 0, done_tasks: ts.done || 0 };
    }));

    res.json({ stats, recent_tasks: recentTasks, projects: projectsWithStats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
