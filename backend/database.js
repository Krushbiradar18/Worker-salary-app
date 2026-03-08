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
      site_id INTEGER
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
      paid INTEGER DEFAULT 0,
      UNIQUE(worker_id, month, year)
    )
  `);

});

module.exports = db;