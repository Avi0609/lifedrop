const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let dbClient = null;

if (DB_TYPE === 'mysql') {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_donation',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  dbClient = {
    type: 'mysql',
    async query(sql, params = []) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    async get(sql, params = []) {
      const [rows] = await pool.execute(sql, params);
      return rows[0] || null;
    },
    async execute(sql, params = []) {
      const [result] = await pool.execute(sql, params);
      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId
      };
    },
    async initDb() {
      console.log('Connected to MySQL database.');
    }
  };
} else {
  // Built-in SQLite (Node 22.5+ / Node 24)
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'blood_donation.db');
  const db = new DatabaseSync(dbPath);

  dbClient = {
    type: 'sqlite',
    async query(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    },
    async get(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.get(...params) || null;
    },
    async execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const res = stmt.run(...params);
      return {
        affectedRows: res.changes,
        insertId: Number(res.lastInsertRowid)
      };
    },
    async initDb() {
      // Check if donors table exists
      const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='donors'").get();
      if (!check) {
        console.log('Initializing SQLite database schema from schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          db.exec(sql);
          console.log('Database initialized and seeded successfully.');
        } else {
          console.warn('schema.sql not found at', schemaPath);
        }
      } else {
        console.log('SQLite database ready. Existing tables detected.');
      }
    }
  };
}

module.exports = dbClient;

