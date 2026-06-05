const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user.role === 'admin';
    const userId  = req.user.id;

    // For members: show ALL tasks in projects they belong to + tasks assigned to them
    // For admins: show only tasks in their own projects (projects they created or are member of)
    let statsSQL, statsParams, recentSQL, recentParams;

    if (isAdmin) {
      // Admin sees tasks from projects they created or are a member of
      statsSQL = `
        SELECT
          COUNT(DISTINCT t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
          SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date::date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
        FROM tasks t
        LEFT JOIN project_members pm ON pm.project_id = t.project_id
        WHERE (t.created_by = ? OR pm.user_id = ? OR t.assignee_id = ?)
      `;
      statsParams = [userId, userId, userId];

      recentSQL = `
        SELECT DISTINCT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assignee_id
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN project_members pm ON pm.project_id = t.project_id
        WHERE (t.created_by = ? OR pm.user_id = ? OR t.assignee_id = ?)
        ORDER BY t.created_at DESC
        LIMIT 10
      `;
      recentParams = [userId, userId, userId];
    } else {
      // Member sees ALL tasks in their projects + assigned tasks
      statsSQL = `
        SELECT
          COUNT(DISTINCT t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
          SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date::date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
        FROM tasks t
        LEFT JOIN project_members pm ON pm.project_id = t.project_id
        WHERE (t.assignee_id = ? OR pm.user_id = ?)
      `;
      statsParams = [userId, userId];

      recentSQL = `
        SELECT DISTINCT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assignee_id
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN project_members pm ON pm.project_id = t.project_id
        WHERE (t.assignee_id = ? OR pm.user_id = ?)
        ORDER BY t.created_at DESC
        LIMIT 10
      `;
      recentParams = [userId, userId];
    }

    const stats       = await db.prepare(statsSQL).get(...statsParams);
    const recentTasks = await db.prepare(recentSQL).all(...recentParams);

    // Projects: only projects the user is a member of (or created if admin)
    let projects;
    if (isAdmin) {
      projects = await db.prepare(`
        SELECT DISTINCT p.* FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        WHERE p.created_by = ? OR pm.user_id = ?
        ORDER BY p.created_at DESC
      `).all(userId, userId);
    } else {
      projects = await db.prepare(`
        SELECT p.* FROM projects p
        INNER JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = ? ORDER BY p.created_at DESC
      `).all(userId);
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
