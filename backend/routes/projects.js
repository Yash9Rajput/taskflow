const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

function genId() {
  return require('crypto').randomUUID ? require('crypto').randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function enrichProject(db, project) {
  const members = await db.prepare(`
    SELECT u.id, u.name, u.email, u.role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(project.id);

  const taskStats = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo
    FROM tasks WHERE project_id = ?
  `).get(project.id);

  return { ...project, members, task_stats: taskStats };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    let projects;
    if (req.user.role === 'admin') {
      projects = await db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    } else {
      projects = await db.prepare(`
        SELECT p.* FROM projects p
        INNER JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = ? ORDER BY p.created_at DESC
      `).all(req.user.id);
    }
    const result = await Promise.all(projects.map(p => enrichProject(db, p)));
    res.json(result);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role !== 'admin') {
      const membership = await db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
      if (!membership) return res.status(403).json({ error: 'Access denied' });
    }
    res.json(await enrichProject(db, project));
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/',
  authenticate, requireAdmin,
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('member_ids').optional().isArray(),
  validate,
  async (req, res) => {
    try {
      const { name, description = '', member_ids = [] } = req.body;
      const db = getDb();
      const id = genId();

      await db.prepare('INSERT INTO projects (id, name, description, created_by) VALUES (?, ?, ?, ?)').run(id, name, description, req.user.id);

      const allMembers = [...new Set([req.user.id, ...member_ids])];
      for (const uid of allMembers) {
        await db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(id, uid);
      }

      const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      res.status(201).json(await enrichProject(db, project));
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id',
  authenticate, requireAdmin,
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('member_ids').optional().isArray(),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const { name = project.name, description = project.description, member_ids } = req.body;
      await db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);

      if (Array.isArray(member_ids)) {
        await db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.id);
        const allMembers = [...new Set([project.created_by, ...member_ids])];
        for (const uid of allMembers) {
          await db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(req.params.id, uid);
        }
      }

      const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
      res.json(await enrichProject(db, updated));
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
