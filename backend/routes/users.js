const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
const DEV_EMAILS = ['ry1555530@gmail.com', 'rajput.kyar@gmail.com'];

// GET /api/users
// Returns users visible to current user:
// - Users sharing at least one project
// - Users invited by the current user (invited_by = current user id)
// - Always includes self
router.get('/', authenticate, async (req, res) => {
  try {
    const db     = getDb();
    const userId = req.user.id;
    const isDev  = DEV_EMAILS.includes(req.user.email);

    if (isDev) {
      const users = await db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
      return res.json(users);
    }

    // Users who share a project with current user
    const sharedUsers = await db.prepare(`
      SELECT DISTINCT u.id, u.name, u.email, u.role, u.created_at
      FROM users u
      INNER JOIN project_members pm1 ON pm1.user_id = u.id
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE u.id != ?
    `).all(userId, userId);

    // Users invited by current user (even if not yet added to a project)
    let invitedUsers = [];
    try {
      invitedUsers = await db.prepare(`
        SELECT id, name, email, role, created_at FROM users
        WHERE invited_by = ? AND id != ?
      `).all(userId, userId);
    } catch {
      // invited_by column may not exist yet — handled gracefully
    }

    // Merge, deduplicate, add self
    const self = await db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId);
    const seen = new Set();
    const result = [];
    for (const u of [self, ...sharedUsers, ...invitedUsers]) {
      if (u && !seen.has(u.id)) { seen.add(u.id); result.push(u); }
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
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

// ISSUE #4: Remove user from shared projects only (not delete account)
// With option for admin to permanently hide from their team view
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db       = getDb();
    const userId   = req.user.id;
    const targetId = req.params.id;
    const permanent = req.query.permanent === 'true'; // ISSUE #4: permanent remove flag

    if (targetId === userId) return res.status(400).json({ error: 'Cannot remove yourself' });

    const target = await db.prepare('SELECT id, email FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (DEV_EMAILS.includes(target.email)) {
      return res.status(403).json({ error: 'Cannot remove developer accounts' });
    }

    // Remove from all shared projects
    const sharedProjects = await db.prepare(`
      SELECT pm1.project_id
      FROM project_members pm1
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE pm1.user_id = ?
    `).all(userId, targetId);

    for (const { project_id } of sharedProjects) {
      await db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(project_id, targetId);
    }

    // ISSUE #4: If permanent=true, also clear invited_by so they won't show in team
    if (permanent) {
      try {
        await db.prepare('UPDATE users SET invited_by = NULL WHERE id = ? AND invited_by = ?').run(targetId, userId);
      } catch { /* column may not exist */ }
    }

    res.json({
      message: permanent
        ? 'User permanently removed from your team.'
        : 'User removed from your shared projects. Their account remains active.',
      removedFromProjects: sharedProjects.length,
    });
  } catch (err) {
    console.error('Remove user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ISSUE #2: User leaves a specific project themselves
router.delete('/:id/leave/:projectId', authenticate, async (req, res) => {
  try {
    const db        = getDb();
    const userId    = req.user.id;
    const projectId = req.params.projectId;

    if (req.params.id !== userId) {
      return res.status(403).json({ error: 'You can only remove yourself from projects' });
    }

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
    res.json({ message: 'You have left this project successfully.' });
  } catch (err) {
    console.error('Leave project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
