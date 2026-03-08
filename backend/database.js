const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./salary.db");

db.serialize(() => {

  // SITES
  db.run(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  // WORKERS
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      site_id INTEGER,
      rate INTEGER,
      role TEXT
    )
  `);

  // MONTHLY RATE
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER,
      year INTEGER,
      rate INTEGER
    )
  `);

  // ATTENDANCE
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      month INTEGER,
      year INTEGER,
      attendance_count INTEGER,
      salary INTEGER,
      advance INTEGER DEFAULT 0,
      remark TEXT,
      paid INTEGER DEFAULT 0,
      UNIQUE(worker_id, month, year)
    )
  `);

  // ADVANCES - Multiple advance payments per worker per month
  db.run(`
    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      month INTEGER,
      year INTEGER,
      amount INTEGER,
      remark TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

});

  // Add migration for existing workers table to add rate and role columns
  db.run(`ALTER TABLE workers ADD COLUMN rate INTEGER DEFAULT 500`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      // Column might already exist, ignore error
    }
  });

  db.run(`ALTER TABLE workers ADD COLUMN role TEXT DEFAULT 'Worker'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      // Column might already exist, ignore error  
    }
  });

  // Add migration for existing attendance table to add advance and remark columns
  db.run(`ALTER TABLE attendance ADD COLUMN advance INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      // Column might already exist, ignore error
    }
  });

  db.run(`ALTER TABLE attendance ADD COLUMN remark TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      // Column might already exist, ignore error
    }
  });
module.exports = db;