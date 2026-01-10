const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// S'assurer que le dossier data existe
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Connexion à la base SQLite
const dbPath = path.join(dataDir, "btp.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  fullname TEXT, email TEXT, phone TEXT, address TEXT, service TEXT,
  surface TEXT, message TEXT, status TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  fullname TEXT, email TEXT, phone TEXT, service TEXT,
  message TEXT, status TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT, description TEXT, year TEXT, tags TEXT,
  images TEXT, published INTEGER DEFAULT 0, created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT,
  short TEXT,
  description TEXT,
  price TEXT,
  image TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS callbacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  preferred_time TEXT, 
  status TEXT DEFAULT 'nouvelle',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE, password TEXT
);
`);

module.exports = db;
