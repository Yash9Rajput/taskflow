const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/users  — list all users (authenticated)
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
  res.json(users);
});

// PATCH /api/users/:id/role  — change role (admin only)
router.patch('/:id/role',
  authenticate, requireAdmin,
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  validate,
  (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
    const updated = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  }
);

module.exports = router;

// DELETE /api/users/:id  — remove a user (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

  // Unassign their tasks instead of deleting them
  db.prepare("UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?").run(req.params.id);
  // Remove from project members
  db.prepare("DELETE FROM project_members WHERE user_id = ?").run(req.params.id);
  // Delete the user
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ message: 'User removed successfully' });
});
