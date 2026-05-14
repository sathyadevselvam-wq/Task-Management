const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize DB tables
const fs = require('fs');
const path = require('path');
const initSql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
pool.query(initSql).catch(console.error);

app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, password, initials, photo, bio, role } = req.body;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });
    
    await pool.query(
      `INSERT INTO users (id, name, email, password, initials, photo, bio, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, email, password, initials, photo, bio, role]
    );
    res.json({ id, name, email, password, initials, photo, bio, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await pool.query(`UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tasks endpoints
app.get('/api/tasks', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { id, userId, title, description, status, priority, category, due, created, tags } = req.body;
  try {
    await pool.query(
      `INSERT INTO tasks (id, user_id, title, description, status, priority, category, due, created, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, userId, title, description, status, priority, category, due, created, JSON.stringify(tags || [])]
    );
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'user_id');
    const values = keys.map(k => k === 'tags' ? JSON.stringify(updates[k]) : updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await pool.query(`UPDATE tasks SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
