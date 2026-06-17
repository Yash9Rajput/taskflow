const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const https    = require('https');
const crypto   = require('crypto');

const { getDb }                      = require('../db/database');
const { validate }                   = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function genId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Brevo email helper ────────────────────────────────────────────────────────
function getBrevoKey() {
  return process.env.BREVO_API_KEY || null;
}

async function sendBrevoEmail({ to, toName, from, fromName, replyTo, replyToName, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender:      { name: fromName, email: from },
      to:          [{ email: to, name: toName }],
      replyTo:     { email: replyTo || from, name: replyToName || fromName },
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Accept':         'application/json',
        'api-key':        process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ success: true });
        else reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Rate limiter (in-memory, resets on restart) ───────────────────────────────
const emailRateLimit = new Map();

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

// ── In-memory password reset token store ─────────────────────────────────────
// { token → { userId, email, expires } }
// For production you'd store this in your DB, but in-memory works fine on Render
const resetTokens = new Map();

function createResetToken(userId, email) {
  // Invalidate any existing token for this user first
  for (const [t, v] of resetTokens.entries()) {
    if (v.userId === userId) resetTokens.delete(t);
  }
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  resetTokens.set(token, { userId, email, expires });
  return token;
}

function consumeResetToken(token) {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expires) { resetTokens.delete(token); return null; }
  resetTokens.delete(token); // one-time use
  return entry;
}

// ── Invite email (existing) ───────────────────────────────────────────────────
async function sendInviteEmail({ toEmail, toName, fromName, fromEmail, password, role, appUrl }) {
  const roleLabel       = role === 'admin' ? '👑 Admin' : '👤 Member';
  const passwordDisplay = password && password.trim().length >= 6 ? password : null;
  const isExistingUser  = !passwordDisplay;

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
  .creds { background: #0d0d1a; border: 1px solid #2d2d44; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
  .creds-title { background: rgba(99,102,241,0.15); padding: 10px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; }
  .creds-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #1e1e30; }
  .creds-row:last-child { border-bottom: none; }
  .creds-label { font-size: 12px; color: #64748b; font-weight: 500; min-width: 120px; }
  .creds-value { font-size: 13px; color: #e2e8f0; font-weight: 600; font-family: 'Courier New', monospace; text-align: right; word-break: break-all; }
  .creds-value.highlight { color: #a5b4fc; background: rgba(99,102,241,0.1); padding: 3px 8px; border-radius: 6px; }
  .creds-value.password  { color: #34d399; background: rgba(52,211,153,0.1); padding: 3px 8px; border-radius: 6px; }
  .login-btn { display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none !important; text-align: center; padding: 16px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 24px; }
  .footer { background: #111120; text-align: center; padding: 20px 32px; border-top: 1px solid #1e1e30; font-size: 11px; color: #475569; line-height: 2; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>🚀 TaskFlow</h1><p>You have been invited to join a team!</p></div>
    <div class="body">
      <div class="greeting">Hello, ${toName}! 👋</div>
      <div class="message"><strong>${fromName}</strong> has invited you to collaborate on <strong>TaskFlow</strong> as a <strong>${roleLabel}</strong>.</div>
      <div class="creds">
        <div class="creds-title">🔐 Your Login Credentials</div>
        <div class="creds-row"><span class="creds-label">📧 Email</span><span class="creds-value highlight">${toEmail}</span></div>
        <div class="creds-row"><span class="creds-label">🔑 Password</span>
          ${passwordDisplay ? `<span class="creds-value password">${passwordDisplay}</span>` : `<span class="creds-value" style="color:#fbbf24">Use your existing password</span>`}
        </div>
        <div class="creds-row"><span class="creds-label">👤 Role</span><span class="creds-value">${roleLabel}</span></div>
      </div>
      <a class="login-btn" href="${appUrl}/login">🔑 Log In to TaskFlow</a>
    </div>
    <div class="footer">TaskFlow · Built by Yash Rajput<br>If you didn't expect this email, you can ignore it.</div>
  </div>
</body>
</html>`;

  return sendBrevoEmail({
    to: toEmail, toName,
    from: 'noreply@taskflowteams.com', fromName: 'TaskFlow',
    replyTo: fromEmail, replyToName: fromName,
    subject: `${fromName} invited you to TaskFlow`,
    html,
  });
}

// ── Password reset email ──────────────────────────────────────────────────────
async function sendPasswordResetEmail({ toEmail, toName, resetLink }) {
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
  .message  { font-size: 14px; color: #94a3b8; line-height: 1.75; margin-bottom: 28px; }
  .reset-btn { display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none !important; text-align: center; padding: 16px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 24px; letter-spacing: 0.3px; }
  .link-box { background: #0d0d1a; border: 1px solid #2d2d44; border-radius: 10px; padding: 14px 16px; font-size: 11px; color: #64748b; word-break: break-all; margin-bottom: 24px; }
  .link-box span { color: #a5b4fc; font-family: monospace; }
  .warning { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #fbbf24; line-height: 1.8; }
  .footer { background: #111120; text-align: center; padding: 20px 32px; border-top: 1px solid #1e1e30; font-size: 11px; color: #475569; line-height: 2; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <h1>🔐 TaskFlow</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${toName}! 👋</div>
      <div class="message">
        We received a request to reset your TaskFlow password. Click the button below to choose a new password.<br><br>
        This link will expire in <strong style="color:#f1f5f9">1 hour</strong>.
      </div>
      <a class="reset-btn" href="${resetLink}">🔑 Reset My Password</a>
      <div class="link-box">
        If the button doesn't work, copy this link:<br>
        <span>${resetLink}</span>
      </div>
      <div class="warning">
        ⚠️ <strong>Didn't request this?</strong><br>
        If you didn't ask for a password reset, you can safely ignore this email. Your password will not change.
      </div>
    </div>
    <div class="footer">TaskFlow · Built by Yash Rajput<br>This link expires in 1 hour and can only be used once.</div>
  </div>
</body>
</html>`;

  return sendBrevoEmail({
    to: toEmail, toName,
    from: 'noreply@taskflowteams.com', fromName: 'TaskFlow',
    replyTo: 'rajput.kyar@gmail.com', replyToName: 'TaskFlow Support',
    subject: 'Reset your TaskFlow password',
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post('/signup',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
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

      try {
        await db.prepare(
          'INSERT INTO users (id, name, email, password, role, invited_by) VALUES (?, ?, ?, ?, ?, NULL)'
        ).run(id, name, email, hashed, role);
      } catch {
        await db.prepare(
          'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
        ).run(id, name, email, hashed, role);
      }

      const user  = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
      const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user });
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

      if (!user || !user.password) {
        // No password = Google-only account
        if (user && !user.password) {
          return res.status(401).json({ error: 'This account uses Google Sign-In. Please click "Continue with Google".' });
        }
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
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

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE OAUTH
// ─────────────────────────────────────────────────────────────────────────────
// Flow:
//  1. Frontend redirects user to GET /api/auth/google
//  2. Google redirects back to GET /api/auth/google/callback with ?code=...
//  3. We exchange code for tokens, get user profile, create/find user, issue JWT
//  4. Redirect to frontend with ?token=...&user=... in URL hash

// GET /api/auth/google — redirect to Google
router.get('/google', (req, res) => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.BACKEND_URL || 'https://taskflow-xhwe.onrender.com'}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(503).send('Google OAuth not configured. Add GOOGLE_CLIENT_ID to environment variables.');
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback — Google redirects here with ?code=
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://taskflowteams.netlify.app';
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }

  try {
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.BACKEND_URL || 'https://taskflow-xhwe.onrender.com'}/api/auth/google/callback`;

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) {
      console.error('Google token exchange failed:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=google_token_failed`);
    }

    // Step 2: Decode id_token to get user info (no extra request needed)
    // id_token is a JWT — decode middle segment (payload)
    const idTokenPayload = JSON.parse(
      Buffer.from(tokenData.id_token.split('.')[1], 'base64url').toString()
    );

    const { sub: googleId, email, name, picture } = idTokenPayload;

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=google_no_email`);
    }

    const db = getDb();

    // Step 3: Find or create user
    let user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // New user via Google — create with member role, no password
      const id = genId();
      try {
        await db.prepare(
          'INSERT INTO users (id, name, email, password, role, google_id, avatar_url) VALUES (?, ?, ?, NULL, ?, ?, ?)'
        ).run(id, name, email, 'member', googleId, picture || null);
      } catch {
        // Fallback if google_id / avatar_url columns don't exist yet
        try {
          await db.prepare(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, NULL, ?)'
          ).run(id, name, email, 'member');
        } catch (insertErr) {
          console.error('Google user insert error:', insertErr);
          return res.redirect(`${frontendUrl}/login?error=db_error`);
        }
      }
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else {
      // Existing user — update google_id & avatar if columns exist
      try {
        await db.prepare(
          'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?'
        ).run(googleId, picture || user.avatar_url, user.id);
      } catch { /* columns may not exist yet — that's fine */ }
    }

    // Step 4: Issue our own JWT
    const token    = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userInfo = JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role });

    // Step 5: Redirect to frontend with token
    // Use hash (#) so token is never sent to server in future navigation
    res.redirect(`${frontendUrl}/auth/callback#token=${encodeURIComponent(token)}&user=${encodeURIComponent(userInfo)}`);

  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${frontendUrl}/login?error=google_server_error`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
// Accepts an email, sends a reset link if the user exists
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req, res) => {
    // Always return 200 — don't leak whether an email exists
    const genericOk = { message: 'If an account with that email exists, a reset link has been sent.' };

    try {
      const { email } = req.body;
      const db   = getDb();
      const user = await db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);

      if (!user) return res.json(genericOk);

      if (!getBrevoKey()) {
        // Dev fallback — log token to console
        const token = createResetToken(user.id, user.email);
        console.log(`[DEV] Password reset token for ${email}: ${token}`);
        return res.json({ ...genericOk, _devToken: token });
      }

      const token     = createResetToken(user.id, user.email);
      const appUrl    = process.env.FRONTEND_URL || 'https://taskflowteams.netlify.app';
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({ toEmail: user.email, toName: user.name, resetLink });
      console.log(`[MAIL] Password reset email sent to ${email}`);
      res.json(genericOk);

    } catch (err) {
      console.error('Forgot password error:', err);
      // Still return 200 — don't expose errors
      res.json(genericOk);
    }
  }
);

// POST /api/auth/reset-password
// Verifies token + sets new password
router.post('/reset-password',
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const entry = consumeResetToken(token);

      if (!entry) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
      }

      const db     = getDb();
      const user   = await db.prepare('SELECT id FROM users WHERE id = ?').get(entry.userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const hashed = bcrypt.hashSync(password, 10);
      await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, entry.userId);

      // Issue a fresh login token so user is immediately logged in
      const jwtToken = jwt.sign({ userId: entry.userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const fullUser = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(entry.userId);

      res.json({ message: 'Password updated successfully!', token: jwtToken, user: fullUser });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INVITE (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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
      const sendEmail = req.body.sendEmail === false || req.body.sendEmail === 'false' ? false : true;
      const db      = getDb();
      const inviter = req.user;

      let existingUser = await db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
      let isReInvite   = false;
      let finalRole    = role;
      let userId;

      if (existingUser) {
        isReInvite = true;
        finalRole  = existingUser.role;
        userId     = existingUser.id;
        try {
          await db.prepare('UPDATE users SET invited_by = ? WHERE id = ?').run(inviter.id, userId);
        } catch { /* column may not exist */ }
      } else {
        const hashed = bcrypt.hashSync(password, 10);
        userId = genId();
        try {
          await db.prepare(
            'INSERT INTO users (id, name, email, password, role, invited_by) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(userId, name, email, hashed, role, inviter.id);
        } catch {
          await db.prepare(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
          ).run(userId, name, email, hashed, role);
          try {
            await db.prepare('UPDATE users SET invited_by = ? WHERE id = ?').run(inviter.id, userId);
          } catch { /* ok */ }
        }
        finalRole = role;
      }

      const user = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
      let emailResult = { sent: false, reason: 'Email sending disabled' };

      if (sendEmail) {
        const { allowed, remaining } = canSendEmail(inviter.id, email);
        if (!allowed) {
          emailResult = { sent: false, reason: 'Daily email limit reached (5/day per address). Try again tomorrow.' };
        } else if (getBrevoKey()) {
          try {
            const appUrl = process.env.FRONTEND_URL || 'https://taskflowteams.netlify.app';
            await sendInviteEmail({
              toEmail:   email,
              toName:    isReInvite ? existingUser.name : name,
              fromName:  inviter.name,
              fromEmail: inviter.email,
              password:  isReInvite ? null : password,
              role:      finalRole,
              appUrl,
            });
            recordEmailSent(inviter.id, email);
            emailResult = { sent: true, remaining: remaining - 1 };
          } catch (mailErr) {
            emailResult = { sent: false, reason: 'Mail delivery failed: ' + mailErr.message };
          }
        } else {
          emailResult = { sent: false, reason: 'BREVO_API_KEY not configured.' };
        }
      }

      res.status(isReInvite ? 200 : 201).json({
        user, isReInvite, email: emailResult,
        message: isReInvite
          ? `${user.name} added to your team.`
          : `${user.name} invited as ${finalRole}.`,
      });
    } catch (err) {
      console.error('Invite error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/send-invite-email
router.post('/send-invite-email', authenticate, requireAdmin,
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req, res) => {
    try {
      const { email }   = req.body;
      const inviter     = req.user;
      const { allowed, remaining, count } = canSendEmail(inviter.id, email);

      if (!allowed) {
        return res.status(429).json({
          error: `Daily email limit reached. You've sent ${count}/5 emails to this address today.`,
        });
      }

      const db     = getDb();
      const target = await db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
      if (!target) return res.status(404).json({ error: 'User not found' });

      if (!getBrevoKey()) {
        return res.status(503).json({ error: 'Email not configured. Add BREVO_API_KEY in Render environment variables.' });
      }

      const appUrl = process.env.FRONTEND_URL || 'https://taskflowteams.netlify.app';
      await sendInviteEmail({
        toEmail:   target.email,
        toName:    target.name,
        fromName:  inviter.name,
        fromEmail: inviter.email,
        password:  null,
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
