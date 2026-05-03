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

const PORT = process.env.PORT || 5000;

// Init DB first, then register routes and start listening
initDb().then(() => {
  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/users',     require('./routes/users'));
  app.use('/api/projects',  require('./routes/projects'));
  app.use('/api/tasks',     require('./routes/tasks'));
  app.use('/api/dashboard', require('./routes/dashboard'));

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
