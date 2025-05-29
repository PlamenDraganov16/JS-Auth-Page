const { parse } = require('querystring');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { getSession, sessions } = require('../utils/sessionUtils');

async function handleGetProfile(req, res) {
  if (req.method === 'GET' && req.url === '/api/profile') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user: session }));
    return true;
  }
  return false;
}

async function handleUpdateProfile(req, res) {
  if (req.method === 'POST' && req.url === '/api/update-profile') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return true;
    }

    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    try {
      const parsed = parse(body);
      const { name } = parsed;

      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Name is required' }));
        return true;
      }

      await db.promise().query('UPDATE users SET name = ? WHERE id = ?', [name, session.id]);

      // Update session
      const sessionKey = Object.keys(sessions).find(key => sessions[key].id === session.id);
      if (sessionKey) {
        sessions[sessionKey].name = name;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Profile updated successfully' }));
      return true;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error' }));
      return true;
    }
  }
  return false;
}

async function handleChangePassword(req, res) {
  if (req.method === 'POST' && req.url === '/api/change-password') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return true;
    }

    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    try {
      const parsed = parse(body);
      const { currentPassword, newPassword } = parsed;

      if (!currentPassword || !newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Both current and new passwords are required' }));
        return true;
      }

      const [results] = await db.promise().query('SELECT * FROM users WHERE id = ?', [session.id]);
      if (results.length === 0) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'User not found' }));
        return true;
      }

      const user = results[0];
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Current password is incorrect' }));
        return true;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, session.id]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Password changed successfully' }));
      return true;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error' }));
      return true;
    }
  }
  return false;
}

module.exports = {
  handleGetProfile,
  handleUpdateProfile,
  handleChangePassword
};
