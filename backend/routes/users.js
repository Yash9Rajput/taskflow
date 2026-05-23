const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const users = await db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
    res.json(users);
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

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const target = await db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await db.prepare('UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM project_members WHERE user_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User removed successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
