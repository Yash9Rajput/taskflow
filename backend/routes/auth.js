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
  // Show actual password for new users, guidance for existing users
  const passwordDisplay = password && password !== '(your existing password)'
    ? password
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f18; color: #e2e8f0; padding: 24px 16px; }
  .card { background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 20px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 32px; text-align: center; }
  .header h1 { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 6px; }
  .header p  { font-size: 14px; color: rgba(255,255,255,0.85); }
  .body { padding: 32px; }
  .greeting { font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 10px; }
  .message  { font-size: 14px; color: #94a3b8; line-height: 1.75; margin-bottom: 24px; }
  .invited-by { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #94a3b8; margin-bottom: 24px; line-height: 1.8; }
  .creds { background: #0d0d1a; border: 1px solid #2d2d44; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
  .creds-title { background: rgba(99,102,241,0.15); padding: 10px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; }
  .creds-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #1e1e30; }
  .creds-row:last-child { border-bottom: none; }
  .creds-label { font-size: 12px; color: #64748b; font-weight: 500; min-width: 120px; }
  .creds-value { font-size: 13px; color: #e2e8f0; font-weight: 600; font-family: 'Courier New', monospace; text-align: right; word-break: break-all; }
  .creds-value.highlight { color: #a5b4fc; background: rgba(99,102,241,0.1); padding: 3px 8px; border-radius: 6px; }
  .creds-value.password { color: #34d399; background: rgba(52,211,153,0.1); padding: 3px 8px; border-radius: 6px; }
  .creds-value.role-admin { color: #fbbf24; }
  .creds-value.role-member { color: #67e8f9; }
  .login-btn { display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none !important; text-align: center; padding: 16px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 24px; letter-spacing: 0.3px; }
  .warning { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #fbbf24; line-height: 1.8; }
  .warning strong { color: #fcd34d; }
  .footer { background: #111120; text-align: center; padding: 20px 32px; border-top: 1px solid #1e1e30; font-size: 11px; color: #475569; line-height: 2; }
  .footer a { color: #6366f1; text-decoration: none; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 TaskFlow</h1>
      <p>You have been invited to join a team!</p>
    </div>

    <div class="body">
      <div class="greeting">Hello, ${toName}! 👋</div>
      <div class="message">
        <strong>${fromName}</strong> has invited you to collaborate on <strong>TaskFlow</strong>
        as a <strong>${roleLabel}</strong>.
        Use the login credentials below to access your account.
      </div>

      <div class="invited-by">
        📩 &nbsp;<strong style="color:#e2e8f0">Invited by:</strong> ${fromName}
        &nbsp;·&nbsp; <a href="mailto:${fromEmail}" style="color:#a5b4fc">${fromEmail}</a><br>
        💬 &nbsp;To contact your admin, reply to this email directly.
      </div>

      <div class="creds">
        <div class="creds-title">🔐 &nbsp;Your Login Credentials</div>
        <div class="creds-row">
          <span class="creds-label">📧 &nbsp;Login Email</span>
          <span class="creds-value highlight">${toEmail}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">🔑 &nbsp;Password</span>
          <span class="creds-value password">${passwordDisplay ? passwordDisplay : 'Use your existing password'}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">👤 &nbsp;Your Role</span>
          <span class="creds-value ${role === 'admin' ? 'role-admin' : 'role-member'}">${roleLabel}</span>
        </div>
        <div class="creds-row">
          <span class="creds-label">👑 &nbsp;Team Admin</span>
          <span class="creds-value">${fromName}</span>
        </div>
      </div>

      <a class="login-btn" href="${appUrl}/login">🔑 &nbsp; Log In to TaskFlow Now</a>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong><br>
        • Save these credentials in a safe place<br>
        • Change your password after first login for security<br>
        • Do not share your password with anyone<br>
        ${passwordDisplay ? '• This password was set by your admin — change it after logging in' : '• Use your existing account password to log in'}
      </div>
    </div>

    <div class="footer">
      This is an automated notification from <strong style="color:#a5b4fc">TaskFlow</strong><br>
      Sent on behalf of your team admin · <strong>${fromName}</strong><br>
      Questions? Contact your admin at <a href="mailto:${fromEmail}">${fromEmail}</a><br>
      If you did not expect this invitation, you can safely ignore this email.<br>
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
        // Re-invite: UPDATE role to new role + UPDATE password if provided
        isReInvite = true;
        finalRole  = role; // use the NEW role specified by admin
        userId     = existingUser.id;

        // Update role
        await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

        // Update password if provided
        if (password && password.trim().length >= 6) {
          const bcrypt = require('bcryptjs');
          const hashed = bcrypt.hashSync(password, 10);
          await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);
        }

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
                // Always show the password in email — new users get their password,
                // re-invited users get their updated password
                password:  password && password.trim().length >= 6 ? password : null,
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
          ? `${user.name} re-invited to your team as ${finalRole}. Role and password updated.`
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
