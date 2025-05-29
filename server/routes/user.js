const { parse } = require('querystring'); // To parse url-encoded form data from request body
const bcrypt = require('bcrypt'); // For password hashing and comparison

const db = require('../config/db');
const { getSession, sessions } = require('../utils/sessionUtils');


// Handle GET /api/profile to fetch the logged-in user's profile data
async function handleGetProfile(req, res) {
  if (req.method === 'GET' && req.url === '/api/profile') {
    const session = getSession(req); 
    if (!session) {
      
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return true;
    }

    // Respond with user data from session
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user: session }));
    return true;
  }
  return false; // Not this route, so return false for other handlers to try
}


// Handle POST /api/update-profile to update the user's name
async function handleUpdateProfile(req, res) {
  if (req.method === 'POST' && req.url === '/api/update-profile') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      return true;
    }

    let body = '';
    // Collect incoming data chunks from request body
    for await (const chunk of req) {
      body += chunk.toString();
    }

    try {
      const parsed = parse(body); // Parse urlencoded form data
      const { name } = parsed;

      if (!name) {
        // Validate name presence
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Name is required' }));
        return true;
      }
      
      // Update user's name in the database
      await db.promise().query('UPDATE users SET name = ? WHERE id = ?', [name, session.id]);

      // Also update the in-memory session data to keep it in sync
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

// Handle POST /api/change-password to allow user to change their password
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

      // Validate required fields
      if (!currentPassword || !newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Both current and new passwords are required' }));
        return true;
      }

      // Fetch current user from database
      const [results] = await db.promise().query('SELECT * FROM users WHERE id = ?', [session.id]);
      if (results.length === 0) {
         // User not found - unlikely but possible if DB out of sync
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'User not found' }));
        return true;
      }

      const user = results[0];
      // Check if current password matches stored hashed password
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Current password is incorrect' }));
        return true;
      }

      // Hash the new password before storing
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
