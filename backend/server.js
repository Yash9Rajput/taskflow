require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { initDb } = require('./db/database');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── TEMPORARY: Fix admin roles + reset password ───────────────────────────
// Visit: https://taskflow-xhwe.onrender.com/fix-admin
// REMOVE THIS BLOCK after you successfully log in
app.get('/fix-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { getDb } = require('./db/database');
    const db = getDb();

    const newPassword = bcrypt.hashSync('Admin@1234', 10);

    // Set both accounts to admin + reset password
    await db.prepare("UPDATE users SET role='admin', password=? WHERE email='ry1555530@gmail.com'").run(newPassword);
    await db.prepare("UPDATE users SET role='admin', password=? WHERE email='rajput.kyar@gmail.com'").run(newPassword);

    const users = await db.prepare("SELECT id, name, email, role FROM users").all();
    res.json({
      message: 'Done! Both accounts are now admin. New password is: Admin@1234',
      users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─── END TEMPORARY ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

// Init DB first, then register routes and start listening
initDb().then(() => {
  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/users',     require('./routes/users'));
  app.use('/api/projects',  require('./routes/projects'));
  app.use('/api/tasks',     require('./routes/tasks'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/ai',        require('./routes/ai'));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`TaskFlow API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
