const express = require('express');
const { body } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/users — only users visible to current user
router.get('/', authenticate, async (req, res) => {
  try {
    const db     = getDb();
    const userId = req.user.id;
    // All users follow same visibility rules — no special dev privileges

    // Users sharing a project with current user
    const sharedUsers = await db.prepare(`
      SELECT DISTINCT u.id, u.name, u.email, u.role, u.created_at, u.avatar
      FROM users u
      INNER JOIN project_members pm1 ON pm1.user_id = u.id
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE u.id != ?
    `).all(userId, userId);

    // Users invited by current user (even before added to a project)
    let invitedUsers = [];
    try {
      invitedUsers = await db.prepare(
        `SELECT id, name, email, role, created_at, avatar FROM users WHERE invited_by = ? AND id != ?`
      ).all(userId, userId);
    } catch { /* invited_by column may not exist yet */ }

    // Merge + self
    const self = await db.prepare('SELECT id, name, email, role, created_at, avatar FROM users WHERE id = ?').get(userId);
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


// ─────────────────────────────────────────────────────────────────────────────
// PROFILE  (own profile, avatar, public card)
// These routes use "/me/..." and "/public/..." so they never clash with "/:id".
// ─────────────────────────────────────────────────────────────────────────────
const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;
const AVATAR_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
const AVATAR_MAX_CHARS = 90000; // stays under Express' default 100 kb JSON limit

const PROFILE_SELECT =
  'id, name, email, role, created_at, handle, bio, country, college, degree, branch, grad_year, github, linkedin, website, skills, card_public, avatar';

const parseSkills = (v) => (v ? String(v).split(',').map(x => x.trim()).filter(Boolean) : []);

function shapeProfile(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at,
    handle: u.handle || '', bio: u.bio || '', country: u.country || '', college: u.college || '',
    degree: u.degree || '', branch: u.branch || '', grad_year: u.grad_year || '',
    github: u.github || '', linkedin: u.linkedin || '', website: u.website || '',
    skills: parseSkills(u.skills), card_public: Number(u.card_public) === 1,
    avatar: u.avatar || null,
  };
}

// Only http(s) links are allowed; bare "github.com/x" gets https:// added.
function cleanUrl(v) {
  const t = String(v || '').trim();
  if (!t) return '';
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try { const u = new URL(withProto); return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : ''; }
  catch { return ''; }
}

async function makeHandle(db, user) {
  let base = String(user.email || user.name || 'user').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  if (base.length < 3) base = (base + 'user').slice(0, 8);
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const hit = await db.prepare('SELECT id FROM users WHERE LOWER(handle) = LOWER(?)').get(candidate);
    if (!hit) return candidate;
    candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;
  }
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

async function getStats(db, userId) {
  const out = { projects: 0, tasks_total: 0, tasks_done: 0, active_days: 0 };
  try {
    const p = await db.prepare('SELECT COUNT(*) AS c FROM project_members WHERE user_id = ?').get(userId);
    out.projects = Number(p?.c) || 0;
    const t = await db.prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done FROM tasks WHERE assignee_id = ? OR created_by = ?"
    ).get(userId, userId);
    out.tasks_total = Number(t?.total) || 0;
    out.tasks_done  = Number(t?.done)  || 0;
  } catch (e) { console.error('Stats error:', e.message); }
  try {
    const d = await db.prepare(
      `SELECT COUNT(*) AS c FROM (
         SELECT created_at::date AS d FROM tasks WHERE assignee_id = ? OR created_by = ?
         UNION
         SELECT updated_at::date AS d FROM tasks WHERE assignee_id = ? OR created_by = ?
       ) x`
    ).get(userId, userId, userId, userId);
    out.active_days = Number(d?.c) || 0;
  } catch { /* PostgreSQL-only query; ignore elsewhere */ }
  return out;
}

// GET /api/users/me/profile
router.get('/me/profile', authenticate, async (req, res) => {
  try {
    const db = getDb();
    let u = await db.prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE id = ?`).get(req.user.id);
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (!u.handle) {
      const handle = await makeHandle(db, u);
      await db.prepare('UPDATE users SET handle = ? WHERE id = ?').run(handle, u.id);
      u.handle = handle;
    }
    res.json({ profile: shapeProfile(u), stats: await getStats(db, u.id) });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me/profile
router.put('/me/profile',
  authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Name must be 1-80 characters'),
  body('bio').optional({ nullable: true }).isLength({ max: 200 }).withMessage('Bio can be at most 200 characters'),
  body('country').optional({ nullable: true }).isLength({ max: 60 }),
  body('college').optional({ nullable: true }).isLength({ max: 120 }),
  body('degree').optional({ nullable: true }).isLength({ max: 80 }),
  body('branch').optional({ nullable: true }).isLength({ max: 80 }),
  body('grad_year').optional({ nullable: true }).isLength({ max: 4 }),
  body('github').optional({ nullable: true }).isLength({ max: 200 }),
  body('linkedin').optional({ nullable: true }).isLength({ max: 200 }),
  body('website').optional({ nullable: true }).isLength({ max: 200 }),
  body('skills').optional({ nullable: true }).isArray({ max: 12 }).withMessage('Up to 12 skills'),
  body('handle').optional({ nullable: true }).custom(v => !v || HANDLE_RE.test(v)).withMessage('Username: 3-20 letters, numbers or underscore'),
  validate,
  async (req, res) => {
    try {
      const db = getDb();
      const b  = req.body;
      const sets = [];
      const vals = [];
      const put = (col, val) => { sets.push(`${col} = ?`); vals.push(val); };

      if (b.name !== undefined)      put('name', String(b.name).trim());
      if (b.bio !== undefined)       put('bio', String(b.bio || '').trim());
      if (b.country !== undefined)   put('country', String(b.country || '').trim());
      if (b.college !== undefined)   put('college', String(b.college || '').trim());
      if (b.degree !== undefined)    put('degree', String(b.degree || '').trim());
      if (b.branch !== undefined)    put('branch', String(b.branch || '').trim());
      if (b.grad_year !== undefined) put('grad_year', String(b.grad_year || '').replace(/[^0-9]/g, '').slice(0, 4));
      if (b.github !== undefined)    put('github', cleanUrl(b.github));
      if (b.linkedin !== undefined)  put('linkedin', cleanUrl(b.linkedin));
      if (b.website !== undefined)   put('website', cleanUrl(b.website));
      if (b.skills !== undefined) {
        const list = (b.skills || []).map(x => String(x).replace(/,/g, ' ').trim().slice(0, 24)).filter(Boolean).slice(0, 12);
        put('skills', list.join(','));
      }
      if (b.card_public !== undefined) put('card_public', b.card_public ? 1 : 0);
      if (b.handle) {
        const taken = await db.prepare('SELECT id FROM users WHERE LOWER(handle) = LOWER(?) AND id != ?').get(b.handle, req.user.id);
        if (taken) return res.status(409).json({ error: 'That username is already taken' });
        put('handle', b.handle);
      }

      if (sets.length) {
        await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.user.id);
      }
      const u = await db.prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE id = ?`).get(req.user.id);
      res.json({ profile: shapeProfile(u) });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/users/me/avatar   { avatar: "data:image/jpeg;base64,..." | null }
router.put('/me/avatar', authenticate, async (req, res) => {
  try {
    const { avatar } = req.body || {};
    if (avatar !== null && avatar !== undefined && avatar !== '') {
      if (typeof avatar !== 'string' || !AVATAR_RE.test(avatar)) {
        return res.status(422).json({ error: 'Photo must be a PNG, JPG or WebP image' });
      }
      if (avatar.length > AVATAR_MAX_CHARS) {
        return res.status(413).json({ error: 'Photo is too large. Please choose a smaller image.' });
      }
    }
    const value = avatar || null;
    await getDb().prepare('UPDATE users SET avatar = ? WHERE id = ?').run(value, req.user.id);
    res.json({ avatar: value });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/public/:handle — no login; only works if the user turned their card public
router.get('/public/:handle', async (req, res) => {
  try {
    const db = getDb();
    const handle = String(req.params.handle || '');
    if (!HANDLE_RE.test(handle)) return res.status(404).json({ error: 'Card not found' });
    const u = await db.prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE LOWER(handle) = LOWER(?)`).get(handle);
    if (!u || Number(u.card_public) !== 1) return res.status(404).json({ error: 'This card is private or does not exist' });
    const p = shapeProfile(u);
    res.json({
      profile: {
        name: p.name, handle: p.handle, role: p.role, bio: p.bio, skills: p.skills, avatar: p.avatar,
        github: p.github, linkedin: p.linkedin, website: p.website, created_at: p.created_at,
      },
      stats: await getStats(db, u.id),
    });
  } catch (err) {
    console.error('Public card error:', err);
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

// DELETE /api/users/:id
// ISSUE #1 FIX: Permanently removes user from team (removes from shared projects + clears invited_by)
// Account stays alive — they can still log in with same credentials
// ISSUE #2 FIX: Re-invite works because account still exists — invite flow handles existing emails
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db       = getDb();
    const userId   = req.user.id;
    const targetId = req.params.id;

    if (targetId === userId) return res.status(400).json({ error: 'Cannot remove yourself' });

    const target = await db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // No special protection for dev accounts — anyone can remove anyone from their team
    // Dev accounts follow same rules as regular admins

    // Remove from ALL projects shared with current user
    const sharedProjects = await db.prepare(`
      SELECT pm1.project_id
      FROM project_members pm1
      INNER JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE pm1.user_id = ?
    `).all(userId, targetId);

    for (const { project_id } of sharedProjects) {
      await db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(project_id, targetId);
    }

    // Clear invited_by so they disappear from team page
    try {
      await db.prepare('UPDATE users SET invited_by = NULL WHERE id = ? AND invited_by = ?').run(targetId, userId);
    } catch { /* column may not exist yet */ }

    // Account is NOT deleted — user can still log in with same credentials
    res.json({
      message: 'User removed from your team and shared projects. Their account is still active.',
      removedFromProjects: sharedProjects.length,
      role: target.role,
    });
  } catch (err) {
    console.error('Remove user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id/leave/:projectId — user leaves a project themselves
router.delete('/:id/leave/:projectId', authenticate, async (req, res) => {
  try {
    const db        = getDb();
    const userId    = req.user.id;
    const projectId = req.params.projectId;

    if (req.params.id !== userId) {
      return res.status(403).json({ error: 'You can only remove yourself from projects' });
    }

    await db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
    res.json({ message: 'You have left this project.' });
  } catch (err) {
    console.error('Leave project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
