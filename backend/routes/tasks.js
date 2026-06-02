const express = require('express');
const { body, query } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

function genId() {
  return require('crypto').randomUUID ? require('crypto').randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function enrichTask(db, task) {
  const assignee = task.assignee_id
    ? await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(task.assignee_id)
    : null;
  const project = task.project_id
    ? await db.prepare('SELECT id, name FROM projects WHERE id = ?').get(task.project_id)
    : null;
  const createdBy = await db.prepare('SELECT id, name FROM users WHERE id = ?').get(task.created_by);
  const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
  return { ...task, assignee, project, created_by_user: createdBy, is_overdue: isOverdue };
}

// GET /api/tasks
// Members see ALL tasks in projects they belong to + tasks assigned to them
// Admins see everything
router.get('/',
  authenticate,
  query('project_id').optional().isString(),
  query('status').optional().isIn(['todo', 'in-progress', 'done']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('assignee_id').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const { project_id, status, priority, assignee_id, overdue } = req.query;

      let sql = 'SELECT DISTINCT t.* FROM tasks t';
      const params = [];

      if (req.user.role !== 'admin') {
        // Members see tasks if:
        // 1. They are the assignee
        // 2. They created the task
        // 3. The task belongs to a project they are a member of
        sql += ` LEFT JOIN project_members pm ON pm.project_id = t.project_id
                 WHERE (
                   t.assignee_id = ?
                   OR t.created_by = ?
                   OR pm.user_id = ?
                 )`;
        params.push(req.user.id, req.user.id, req.user.id);
      } else {
        sql += ' WHERE 1=1';
      }

      if (project_id)  { sql += ' AND t.project_id = ?';  params.push(project_id); }
      if (status)      { sql += ' AND t.status = ?';      params.push(status); }
      if (priority)    { sql += ' AND t.priority = ?';    params.push(priority); }
      if (assignee_id) { sql += ' AND t.assignee_id = ?'; params.push(assignee_id); }
      sql += ' ORDER BY t.due_date ASC, t.created_at DESC';

      let tasks = await db.prepare(sql).all(...params);
      tasks = await Promise.all(tasks.map(t => enrichTask(db, t)));
      if (overdue === 'true') tasks = tasks.filter(t => t.is_overdue);
      res.json(tasks);
    } catch (err) {
      console.error('Get tasks error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Access check: admin, assignee, creator, or project member
    if (req.user.role !== 'admin') {
      const isMember = task.project_id
        ? await db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id)
        : null;
      const isAssignee = task.assignee_id === req.user.id;
      const isCreator  = task.created_by  === req.user.id;
      if (!isMember && !isAssignee && !isCreator) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(await enrichTask(db, task));
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/',
  authenticate, requireAdmin,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('project_id').optional({ nullable: true }).isString(),
  body('description').optional({ nullable: true }).trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignee_id').optional({ nullable: true }).isString(),
  body('due_date').optional({ nullable: true }).isISO8601(),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const {
        title,
        project_id  = null,
        description = '',
        status      = 'todo',
        priority    = 'medium',
        assignee_id = null,
        due_date    = null,
      } = req.body;

      if (project_id) {
        const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
      }
      if (assignee_id) {
        const assignee = await db.prepare('SELECT id FROM users WHERE id = ?').get(assignee_id);
        if (!assignee) return res.status(404).json({ error: 'Assignee not found' });
      }

      const id = genId();
      await db.prepare(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, due_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, project_id, title, description, status, priority, assignee_id, due_date, req.user.id);

      const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.status(201).json(await enrichTask(db, task));
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id',
  authenticate,
  body('title').optional().trim().notEmpty(),
  body('description').optional({ nullable: true }).trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignee_id').optional({ nullable: true }),
  body('due_date').optional({ nullable: true }).isISO8601(),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const isAdmin    = req.user.role === 'admin';
      const isAssignee = task.assignee_id === req.user.id;

      // Project members can update status (their progress) but not admin-only fields
      const isMember = task.project_id
        ? await db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id)
        : null;

      if (!isAdmin && !isAssignee && !isMember) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const fields = {
        title:       req.body.title       ?? task.title,
        description: req.body.description ?? task.description,
        // Any project member can update status
        status:      req.body.status      ?? task.status,
        // Only admin can change priority, assignee, due_date
        priority:    isAdmin ? (req.body.priority    ?? task.priority)    : task.priority,
        assignee_id: isAdmin ? (req.body.assignee_id !== undefined ? req.body.assignee_id : task.assignee_id) : task.assignee_id,
        due_date:    isAdmin ? (req.body.due_date     !== undefined ? req.body.due_date    : task.due_date)    : task.due_date,
      };

      await db.prepare(
        `UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=? WHERE id=?`
      ).run(fields.title, fields.description, fields.status, fields.priority, fields.assignee_id, fields.due_date, req.params.id);

      const updated = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      res.json(await enrichTask(db, updated));
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const task = await db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
