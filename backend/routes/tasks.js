const express = require('express');
const { body, query } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

function genId() {
  return require('crypto').randomUUID ? require('crypto').randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function canAccessProject(db, projectId, userId, role) {
  if (role === 'admin') return true;
  return !!db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
}

function enrichTask(db, task) {
  const assignee = task.assignee_id
    ? db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(task.assignee_id)
    : null;
  const project = db.prepare('SELECT id, name FROM projects WHERE id = ?').get(task.project_id);
  const createdBy = db.prepare('SELECT id, name FROM users WHERE id = ?').get(task.created_by);
  const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
  return { ...task, assignee, project, created_by_user: createdBy, is_overdue: isOverdue };
}

// GET /api/tasks  — supports ?project_id, ?status, ?assignee_id, ?priority, ?overdue
router.get('/',
  authenticate,
  query('project_id').optional().isString(),
  query('status').optional().isIn(['todo', 'in-progress', 'done']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('assignee_id').optional().isString(),
  validate,
  (req, res) => {
    const db = getDb();
    const { project_id, status, priority, assignee_id, overdue } = req.query;

    let sql = 'SELECT t.* FROM tasks t WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      sql += ' AND (t.assignee_id = ? OR t.created_by = ?)';
      params.push(req.user.id, req.user.id);
    }
    if (project_id) { sql += ' AND t.project_id = ?'; params.push(project_id); }
    if (status)     { sql += ' AND t.status = ?';     params.push(status); }
    if (priority)   { sql += ' AND t.priority = ?';   params.push(priority); }
    if (assignee_id){ sql += ' AND t.assignee_id = ?'; params.push(assignee_id); }

    sql += ' ORDER BY t.due_date ASC, t.created_at DESC';

    let tasks = db.prepare(sql).all(...params).map(t => enrichTask(db, t));

    if (overdue === 'true') tasks = tasks.filter(t => t.is_overdue);

    res.json(tasks);
  }
);

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!canAccessProject(db, task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(enrichTask(db, task));
});

// POST /api/tasks  (admin only)
router.post('/',
  authenticate, requireAdmin,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('project_id').notEmpty().withMessage('project_id is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignee_id').optional().isString(),
  body('due_date').optional().isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD)'),
  validate,
  (req, res) => {
    const db = getDb();
    const { title, project_id, description = '', status = 'todo', priority = 'medium', assignee_id = null, due_date = null } = req.body;

    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (assignee_id && !db.prepare('SELECT id FROM users WHERE id = ?').get(assignee_id)) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    const id = genId();
    db.prepare(`INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, due_date, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, project_id, title, description, status, priority, assignee_id, due_date, req.user.id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json(enrichTask(db, task));
  }
);

// PUT /api/tasks/:id  (admin or assignee)
router.put('/:id',
  authenticate,
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignee_id').optional(),
  body('due_date').optional().isISO8601().withMessage('due_date must be YYYY-MM-DD'),
  validate,
  (req, res) => {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignee_id === req.user.id;
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'Only admins or the assigned member can edit this task' });
    }

    const fields = {
      title: req.body.title ?? task.title,
      description: req.body.description ?? task.description,
      status: req.body.status ?? task.status,
      priority: isAdmin ? (req.body.priority ?? task.priority) : task.priority,
      assignee_id: isAdmin ? (req.body.assignee_id !== undefined ? req.body.assignee_id : task.assignee_id) : task.assignee_id,
      due_date: isAdmin ? (req.body.due_date !== undefined ? req.body.due_date : task.due_date) : task.due_date,
    };

    db.prepare(`UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=? WHERE id=?`)
      .run(fields.title, fields.description, fields.status, fields.priority, fields.assignee_id, fields.due_date, req.params.id);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(enrichTask(db, updated));
  }
);

// DELETE /api/tasks/:id  (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
