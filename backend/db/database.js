const path = require('path');
const fs   = require('fs');
const DB_PATH = path.join(__dirname, '..', 'taskflow.db');
let _proxy = null;

function getDb() {
  if (!_proxy) throw new Error('DB not ready');
  return _proxy;
}

async function initDb() {
  if (process.env.DATABASE_URL) {
    await initPostgres();
  } else {
    await initSqlite();
  }
}

async function initPostgres() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query('SELECT 1');
  _proxy = {
    prepare: (sql) => ({
      async get(...p) { const r = await pool.query(sql.replace(/\?/g,(_,i)=>`$${i+1}`), p.flat()); return r.rows[0]; },
      async all(...p) { const r = await pool.query(sql.replace(/\?/g,(_,i)=>`$${i+1}`), p.flat()); return r.rows; },
      async run(...p) { await pool.query(sql.replace(/\?/g,(_,i)=>`$${i+1}`), p.flat()); return {changes:1}; },
    }),
    async exec(sql) { await pool.query(sql); },
  };
  // Fix placeholder conversion
  _proxy.prepare = (sql) => {
    let i=0; const pg = sql.replace(/\?/g,()=>`$${++i}`);
    return {
      async get(...p)  { const r=await pool.query(pg,p.flat()); return r.rows[0]; },
      async all(...p)  { const r=await pool.query(pg,p.flat()); return r.rows; },
      async run(...p)  { await pool.query(pg,p.flat()); return {changes:1}; },
    };
  };
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT DEFAULT '',created_by TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS project_members (project_id TEXT NOT NULL,user_id TEXT NOT NULL,PRIMARY KEY(project_id,user_id));
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,project_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'todo',priority TEXT NOT NULL DEFAULT 'medium',assignee_id TEXT,due_date TEXT,created_by TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  `);
  console.log('PostgreSQL ready');
}

async function initSqlite() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const rawDb = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  const persist = () => fs.writeFileSync(DB_PATH, Buffer.from(rawDb.export()));
  _proxy = {
    prepare: (sql) => {
      const isWrite = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql);
      return {
        get(...p) { const r=rawDb.exec(sql,p.flat()); if(!r.length||!r[0].values.length)return undefined; const{columns,values}=r[0]; return Object.fromEntries(columns.map((c,i)=>[c,values[0][i]])); },
        all(...p) { const r=rawDb.exec(sql,p.flat()); if(!r.length)return[]; const{columns,values}=r[0]; return values.map(row=>Object.fromEntries(columns.map((c,i)=>[c,row[i]]))); },
        run(...p) { rawDb.run(sql,p.flat()); if(isWrite)persist(); return{changes:rawDb.getRowsModified()}; },
      };
    },
    exec(sql) { rawDb.run(sql); persist(); },
  };
  rawDb.run(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at TEXT NOT NULL DEFAULT(datetime('now')));CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT DEFAULT'',created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')));CREATE TABLE IF NOT EXISTS project_members(project_id TEXT NOT NULL,user_id TEXT NOT NULL,PRIMARY KEY(project_id,user_id));CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT DEFAULT'',status TEXT NOT NULL DEFAULT'todo',priority TEXT NOT NULL DEFAULT'medium',assignee_id TEXT,due_date TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')),updated_at TEXT NOT NULL DEFAULT(datetime('now')));`);
  persist();
  console.log('SQLite ready (sql.js)');
}

module.exports = { getDb, initDb };
