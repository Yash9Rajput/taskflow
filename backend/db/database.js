/**
 * database.js — sql.js wrapper that mimics the better-sqlite3 API
 * (prepare().get(), .all(), .run()) so all routes work unchanged.
 * sql.js has zero native dependencies — works on Windows without VS Build Tools.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, '..', 'taskflow.db');
let _db = null;      // raw sql.js Database
let _proxy = null;   // better-sqlite3-compatible wrapper

/* ── Persist to disk after every write ── */
function persist() {
  const buf = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(buf));
}

/* ── Statement shim ── */
function makeStmt(sql) {
  const isWrite = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql);

  return {
    /** Returns first matching row as a plain object, or undefined */
    get(...params) {
      const flat = params.flat();
      const res = _db.exec(sql, flat);
      if (!res.length || !res[0].values.length) return undefined;
      const { columns, values } = res[0];
      return Object.fromEntries(columns.map((c, i) => [c, values[0][i]]));
    },

    /** Returns all matching rows as plain objects */
    all(...params) {
      const flat = params.flat();
      const res = _db.exec(sql, flat);
      if (!res.length) return [];
      const { columns, values } = res[0];
      return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
    },

    /** Executes a write statement; returns { changes, lastInsertRowid } */
    run(...params) {
      const flat = params.flat();
      _db.run(sql, flat);
      if (isWrite) persist();
      return {
        changes: _db.getRowsModified(),
        lastInsertRowid: null,
      };
    },
  };
}

/* ── Public db object (better-sqlite3-compatible surface) ── */
function getDb() {
  if (!_proxy) throw new Error('DB not ready — await initDb() first');
  return _proxy;
}

/* ── Init: load from disk or create fresh ── */
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _proxy = {
    prepare: (sql) => makeStmt(sql),
    exec:    (sql) => { _db.run(sql); persist(); },
  };

  initSchema();
  console.log('SQLite ready (sql.js)');
}

/* ── Schema ── */
function initSchema() {
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_by  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'todo',
      priority    TEXT NOT NULL DEFAULT 'medium',
      assignee_id TEXT,
      due_date    TEXT,
      created_by  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  persist();
}

module.exports = { getDb, initDb };
