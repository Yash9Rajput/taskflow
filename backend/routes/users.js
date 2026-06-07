const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
const DEV_EMAILS = ['ry1555530@gmail.com', 'rajput.kyar@gmail.com'];

// GET all users visible to current user (only shared-project members)
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const isDev  = DEV_EMAILS.includes(req.user.email);

    if (isDev) {
      // Developers see all users
      const users = await db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
      return res.json(users);
    }

    // Everyone else: only see users who share at least one project with them
    // + always include themselves
    const sharedUsers = await db.prepare(`
      SELECT DISTINCT u.id, u.name, u.email, u.role, u.created_at
      FROM users u
      INNER JOIN project_members pm1 ON pm1.user_id = u.id
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      ORDER BY u.name
    `).all(userId);

    // Always include self even if not in any project
    const self = await db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId);
    const ids  = new Set(sharedUsers.map(u => u.id));
    if (!ids.has(userId) && self) sharedUsers.push(self);

    res.json(sharedUsers);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/role',
  authenticate, requireAdmin,
  body('role').isIn(['admin', 'member']),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot change your own role' });
      await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
      const updated = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
      res.json(updated);
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ISSUE #1 FIX: "Delete" from team = REMOVE from shared projects only, NOT delete account
// The user's account stays intact. They just lose project memberships shared with deleter.
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db     = getDb();
    const userId = req.user.id;
    const targetId = req.params.id;

    if (targetId === userId) return res.status(400).json({ error: 'Cannot remove yourself' });

    const target = await db.prepare('SELECT id, email FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Protect developer accounts from removal
    if (DEV_EMAILS.includes(target.email)) {
      return res.status(403).json({ error: 'Cannot remove developer accounts' });
    }

    // ONLY remove the target from projects where the CURRENT USER is also a member
    // This prevents cross-admin interference
    const sharedProjects = await db.prepare(`
      SELECT pm1.project_id
      FROM project_members pm1
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE pm1.user_id = ?
    `).all(userId, targetId);

    for (const { project_id } of sharedProjects) {
      await db.prepare(
        'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
      ).run(project_id, targetId);
    }

    // DO NOT delete the user account — account stays alive
    res.json({
      message: 'User removed from your shared projects. Their account remains active.',
      removedFromProjects: sharedProjects.length,
    });
  } catch (err) {
    console.error('Remove user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ISSUE #2: New endpoint — member removes THEMSELVES from a specific project
router.delete('/:id/leave/:projectId', authenticate, async (req, res) => {
  try {
    const db        = getDb();
    const userId    = req.user.id;
    const projectId = req.params.projectId;

    // Only the user themselves can use this endpoint
    if (req.params.id !== userId) {
      return res.status(403).json({ error: 'You can only remove yourself from projects' });
    }

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Remove from project members
    await db.prepare(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
    ).run(projectId, userId);

    res.json({ message: 'You have left this project successfully.' });
  } catch (err) {
    console.error('Leave project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite new user
router.post('/invite',
  authenticate, requireAdmin,
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'member']),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const { name, email, password, role = 'member' } = req.body;
      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(400).json({ error: 'Email already registered' });

      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      const id = require('crypto').randomUUID ? require('crypto').randomUUID() : Date.now().toString(36);
      await db.prepare(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
      ).run(id, name, email, hashed, role);

      const user = await db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
      res.status(201).json(user);
    } catch (err) {
      console.error('Invite error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
