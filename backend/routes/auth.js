const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const https = require('https');

const { getDb }                    = require('../db/database');
const { validate }                 = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function genId() {
  return require('crypto').randomUUID
    ? require('crypto').randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Brevo (formerly Sendinblue) email — works on Render free tier via HTTPS API ──
// Free tier: 300 emails/day, sends to ANY email, no domain verification needed
function getBrevoKey() {
  return process.env.BREVO_API_KEY || null;
}

async function sendBrevoEmail({ to, toName, from, fromName, replyTo, replyToName, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender:      { name: fromName, email: from },
      to:          [{ email: to, name: toName }],
      replyTo:     { email: replyTo, name: replyToName },
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'api-key':       process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ISSUE #3: Rate limit — max 5 emails per day per target email per sender
// Stored in-memory (resets on server restart, good enough for daily limit)
const emailRateLimit = new Map(); // key: `${senderId}-${targetEmail}-${date}` → count

function canSendEmail(senderId, targetEmail) {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `${senderId}-${targetEmail}-${today}`;
  const count = emailRateLimit.get(key) || 0;
  return { allowed: count < 5, count, remaining: 5 - count };
}

function recordEmailSent(senderId, targetEmail) {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `${senderId}-${targetEmail}-${today}`;
  emailRateLimit.set(key, (emailRateLimit.get(key) || 0) + 1);
}

async function sendInviteEmail({ toEmail, toName, fromName, fromEmail, teamName, password, role, appUrl }) {
  const roleLabel = role === 'admin' ? '👑 Admin' : '👤 Member';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f18; color: #e2e8f0; margin: 0; padding: 20px; }
  .card { background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #fff; }
  .header p  { margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.8); }
  .body { padding: 32px; }
  .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
  .message  { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-bottom: 24px; }
  .creds    { background: #0f0f18; border: 1px solid #2d2d44; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .creds-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #2d2d44; font-size: 13px; }
  .creds-row:last-child { border-bottom: none; }
  .creds-label { color: #64748b; font-weight: 500; }
  .creds-value { color: #e2e8f0; font-weight: 600; font-family: monospace; }
  .btn { display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 15px; margin: 0 auto 24px; max-width: 280px; }
  .warning { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #fbbf24; line-height: 1.6; margin-bottom: 16px; }
  .footer { text-align: center; padding: 16px 32px; border-top: 1px solid #2d2d44; font-size: 11px; color: #475569; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 TaskFlow</h1>
      <p>You've been invited to join a team!</p>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${toName}! 👋</div>
      <div class="message">
        <strong>${fromName}</strong> has invited you to join their team on <strong>TaskFlow</strong>
        as a <strong>${roleLabel}</strong>. Use the credentials below to log in and get started.
      </div>
      <div style="padding:10px 14px;background:rgba(99,102,241,0.08);border-radius:8px;border:1px solid rgba(99,102,241,0.2);font-size:12px;color:#94a3b8;margin-bottom:20px;line-height:1.7;">
        📩 Invited by: <strong style="color:#e2e8f0">${fromName}</strong> &nbsp;·&nbsp;
        <a href="mailto:${fromEmail}" style="color:#a5b4fc">${fromEmail}</a><br>
        💬 To reply directly to ${fromName}, just reply to this email.
      </div>

      <div class="creds">
        <div class="creds-row">
          <span class="creds-label">Team / Invited by</span>
          <span class="creds-value">${fromName}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">Your Email</span>
          <span class="creds-value">${toEmail}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">Your Password</span>
          <span class="creds-value">${password}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">Your Role</span>
          <span class="creds-value">${roleLabel}</span>
        </div>
      </div>

      <a class="btn" href="${appUrl}">🔑 Log In to TaskFlow</a>

      <div class="warning">
        ⚠️ Please change your password after your first login for security.
        Keep these credentials safe and do not share them with others.
      </div>
    </div>
    <div class="footer">
      This is an automated notification from <strong>TaskFlow</strong>.<br>
      Sent by your team admin · <strong>${fromName}</strong><br>
      Questions? Contact your admin at <a href="mailto:${fromEmail}" style="color:#6366f1">${fromEmail}</a><br>
      If you did not expect this invitation, you can safely ignore it.<br>
      © ${new Date().getFullYear()} TaskFlow — Team Collaboration Platform
    </div>
  </div>
</body>
</html>`;

  // Use Brevo API over HTTPS — works on Render free tier, sends to ANY email
  if (!getBrevoKey()) throw new Error('BREVO_API_KEY not configured');

  await sendBrevoEmail({
    to:          toEmail,
    toName:      toName,
    from:        'taskflow.invite@gmail.com',
    fromName:    'TaskFlow Invite',
    replyTo:     fromEmail,
    replyToName: fromName,
    subject:     `🚀 ${fromName} invited you to join TaskFlow`,
    html,
  });
}

// POST /api/auth/signup
router.post('/signup',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']),
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role = 'member' } = req.body;
      const db = getDb();
      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      const hashed = bcrypt.hashSync(password, 10);
      const id     = genId();
      await db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hashed, role);
      const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id, name, email, role } });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const db   = getDb();
      const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// POST /api/auth/invite  (admin only)
// ISSUE #1: Creates new user OR re-invites existing user (account stays, just re-links invited_by)
// ISSUE #2: If email exists, don't change role — keep original role
// ISSUE #3: Send invite email with rate limit of 5/day per email address
router.post('/invite',
  authenticate, requireAdmin,
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').optional({ nullable: true, checkFalsy: true }).isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'member']),
  body('sendEmail').optional(),
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role = 'member' } = req.body;
      // Accept boolean true/false OR string 'true'/'false' from frontend
      const sendEmail = req.body.sendEmail === false || req.body.sendEmail === 'false' ? false : true;
      const db      = getDb();
      const inviter = req.user;

      // ISSUE #2: Check if user already exists
      let existingUser = await db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
      let isReInvite   = false;
      let finalRole    = role;
      let userId;

      if (existingUser) {
        // Re-invite: keep their ORIGINAL role (do not change)
        isReInvite = true;
        finalRole  = existingUser.role; // preserve original role
        userId     = existingUser.id;

        // Re-link invited_by so they reappear in current user's team
        try {
          await db.prepare('UPDATE users SET invited_by = ? WHERE id = ?').run(inviter.id, userId);
        } catch { /* column may not exist */ }
      } else {
        // New user
        const hashed = bcrypt.hashSync(password, 10);
        userId = genId();
        try {
          await db.prepare(
            'INSERT INTO users (id, name, email, password, role, invited_by) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(userId, name, email, hashed, role, inviter.id);
        } catch {
          // invited_by column doesn't exist yet — insert without it
          await db.prepare(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
          ).run(userId, name, email, hashed, role);
          // Try to update invited_by separately
          try {
            await db.prepare('UPDATE users SET invited_by = ? WHERE id = ?').run(inviter.id, userId);
          } catch { /* ok */ }
        }
        finalRole = role;
      }

      const user = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);

      // ISSUE #3: Send invite email (rate limited to 5/day per email)
      let emailResult = { sent: false, reason: 'Email sending disabled' };

      if (sendEmail) {
        const { allowed, remaining } = canSendEmail(inviter.id, email);
        if (!allowed) {
          emailResult = { sent: false, reason: `Daily email limit reached (5/day per address). Try again tomorrow.` };
        } else {
          console.log('[MAIL] Attempting to send invite email to:', email);
          console.log('[MAIL] BREVO_API_KEY configured:', !!process.env.BREVO_API_KEY);
          if (getBrevoKey()) {
            try {
              const appUrl = process.env.FRONTEND_URL || 'https://taskflow-yash9rajputs-projects.vercel.app';
              await sendInviteEmail({
                toEmail:   email,
                toName:    isReInvite ? existingUser.name : name,
                fromName:  inviter.name,
                fromEmail: inviter.email,
                teamName:  inviter.name,
                password:  isReInvite ? '(your existing password)' : password,
                role:      finalRole,
                appUrl,
              });
              recordEmailSent(inviter.id, email);
              console.log('[MAIL] ✅ Email sent successfully to:', email);
              emailResult = { sent: true, remaining: remaining - 1 };
            } catch (mailErr) {
              console.error('[MAIL] Send error:', mailErr.message);
              console.error('[MAIL] Full error:', mailErr);
              emailResult = { sent: false, reason: 'Mail delivery failed: ' + mailErr.message };
            }
          } else {
            emailResult = { sent: false, reason: 'BREVO_API_KEY not configured. Add it in Render environment variables.' };
          }
        }
      }

      res.status(isReInvite ? 200 : 201).json({
        user,
        isReInvite,
        email: emailResult,
        message: isReInvite
          ? `${user.name} re-invited to your team with their original ${finalRole} role.`
          : `${user.name} invited as ${finalRole}.`,
      });
    } catch (err) {
      console.error('Invite error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/send-invite-email — resend email only (no user creation)
router.post('/send-invite-email', authenticate, requireAdmin,
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const inviter   = req.user;
      const { allowed, remaining, count } = canSendEmail(inviter.id, email);

      if (!allowed) {
        return res.status(429).json({
          error: `Daily email limit reached. You've sent ${count}/5 emails to this address today. Try again tomorrow.`,
        });
      }

      const db     = getDb();
      const target = await db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
      if (!target) return res.status(404).json({ error: 'User not found' });

      if (!getBrevoKey()) {
        return res.status(503).json({ error: 'Email not configured. Add BREVO_API_KEY in Render environment variables.' });
      }

      const appUrl = process.env.FRONTEND_URL || 'https://taskflow-yash9rajputs-projects.vercel.app';
      await sendInviteEmail({
        toEmail:   target.email,
        toName:    target.name,
        fromName:  inviter.name,
        fromEmail: inviter.email,
        teamName:  inviter.name,
        password:  '(your existing password)',
        role:      target.role,
        appUrl,
      });
      recordEmailSent(inviter.id, email);

      res.json({ sent: true, remaining: remaining - 1, message: 'Invite email sent successfully.' });
    } catch (err) {
      console.error('Send invite email error:', err);
      res.status(500).json({ error: 'Failed to send email: ' + err.message });
    }
  }
);

module.exports = router;
