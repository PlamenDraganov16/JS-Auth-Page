const { parse } = require('querystring');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { setSession, clearSession, sessions } = require('../utils/sessionUtils'); // We'll create this later for shared session funcs

async function handleRegister(req, res) {
  if (req.method === 'POST' && req.url === '/api/register') {
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    try {
      const parsed = parse(body);
      const { name, email, password } = parsed;

      if (!name || !email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'All fields are required' }));
        return true;
      }

      const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

      if (results.length > 0) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Email already registered' }));
        return true;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.promise().query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
        name, email, hashedPassword
      ]);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'User registered successfully' }));
      return true;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error' }));
      return true;
    }
  }
  return false; // Not handled
}

async function handleLogin(req, res) {
  if (req.method === 'POST' && req.url === '/api/login') {
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }
    try {
      const parsed = parse(body);
      const { email, password } = parsed;

      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Email and password are required' }));
        return true;
      }

      const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

      if (results.length === 0) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
        return true;
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
        return true;
      }

      const userData = { id: user.id, name: user.name, email: user.email };
      setSession(res, userData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Login successful', user: userData }));
      return true;
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error' }));
      return true;
    }
  }
  return false;
}

async function handleLogout(req, res) {
  if (req.method === 'POST' && req.url === '/api/logout') {
    clearSession(req, res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
    return true;
  }
  return false;
}

module.exports = {
  handleRegister,
  handleLogin,
  handleLogout
};
