require('dotenv').config();
const crypto = require('crypto');

const sessions = {};

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('querystring');
const bcrypt = require('bcrypt');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

const getContentType = (ext) => {
  switch (ext) {
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.html': return 'text/html';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
};

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts[0].trim()] = decodeURIComponent(parts[1]);
  });
  return list;
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.sessionId) return null;
  return sessions[cookies.sessionId] || null;
}

function setSession(res, userData) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions[sessionId] = userData;
  // Set cookie with HttpOnly flag for security, path=/ so it applies to whole site
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
}

function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sessionId) {
    delete sessions[cookies.sessionId];
  }
  // Overwrite cookie to expire it immediately
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
}

function handleUpdateProfile(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'POST' && req.url === '/api/update-profile') {
      const session = getSession(req);
      if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return resolve(true);
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const parsed = parse(body);
          const { name } = parsed;

          if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Name is required' }));
            return resolve(true);
          }

          // Update only the name in the database
          db.query('UPDATE users SET name = ? WHERE id = ?', [name, session.id], (updateErr) => {
            if (updateErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Failed to update profile' }));
              return resolve(true);
            }

            // Update session data (if you store name in session)
            const sessionKey = Object.keys(sessions).find(key => sessions[key].id === session.id);
            if (sessionKey) {
              sessions[sessionKey].name = name;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Profile updated successfully' }));
            return resolve(true);
          });
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Server error' }));
          return resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
}

function handleGetProfile(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'GET' && req.url === '/api/profile') {
      const session = getSession(req);
      if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return resolve(true);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user: session }));
      return resolve(true);
    }
    resolve(false);
  });
}

function handleRegister(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'POST' && req.url === '/api/register') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const parsed = parse(body);
          const { name, email, password } = parsed;

          if (!name || !email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'All fields are required' }));
            return resolve(true);
          }

          db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Database error' }));
              return resolve(true);
            }

            if (results.length > 0) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Email already registered' }));
              return resolve(true);
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
              'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
              [name, email, hashedPassword],
              (insertErr) => {
                if (insertErr) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Database error' }));
                  return resolve(true);
                }

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'User registered successfully' }));
                return resolve(true);
              }
            );
          });
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Server error' }));
          return resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
}

function handleLogin(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'POST' && req.url === '/api/login') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const parsed = parse(body);
          const { email, password } = parsed;

          if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Email and password are required' }));
            return resolve(true);
          }

          db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Database error' }));
              return resolve(true);
            }

            if (results.length === 0) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
              return resolve(true);
            }

            const user = results[0];

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
              return resolve(true);
            }

            const userData = { id: user.id, name: user.name, email: user.email };
            setSession(res, userData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Login successful', user: userData }));
            return resolve(true);
          });
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Server error' }));
          return resolve(true);
        }
      });

      return; // don't resolve here, resolve inside 'end' event
    }

    resolve(false); // not handled
  });
}

function handleLogout(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'POST' && req.url === '/api/logout') {
      clearSession(req, res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
      return resolve(true);
    }
    resolve(false);
  });
}

function handleChangePassword(req, res) {
  return new Promise((resolve) => {
    if (req.method === 'POST' && req.url === '/api/change-password') {
      const session = getSession(req);
      if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return resolve(true);
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const parsed = parse(body);
          const { currentPassword, newPassword } = parsed;

          if (!currentPassword || !newPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Both current and new passwords are required' }));
            return resolve(true);
          }

          // Verify current password
          db.query('SELECT * FROM users WHERE id = ?', [session.id], async (err, results) => {
            if (err || results.length === 0) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'User not found' }));
              return resolve(true);
            }

            const user = results[0];
            const match = await bcrypt.compare(currentPassword, user.password);

            if (!match) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Current password is incorrect' }));
              return resolve(true);
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, session.id], (updateErr) => {
              if (updateErr) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Failed to update password' }));
                return resolve(true);
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Password changed successfully' }));
              return resolve(true);
            });
          });
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Server error' }));
          return resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
}

const server = http.createServer(async (req, res) => {
  // Protect profile page - only allow if session exists
  if (req.method === 'GET' && req.url === '/profile.html') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(302, { Location: '/index.html' });
      return res.end();
    }
  }

  // Handle APIs FIRST (before static files)
  const handledRegister = await handleRegister(req, res);
  if (handledRegister) return;

  const handledLogin = await handleLogin(req, res);
  if (handledLogin) return;

  const handledLogout = await handleLogout(req, res);
  if (handledLogout) return;

  const handledProfile = await handleGetProfile(req, res);
  if (handledProfile) return;

  const handledUpdateProfile = await handleUpdateProfile(req, res);
  if (handledUpdateProfile) return;

  const handledChangePassword = await handleChangePassword(req, res);
  if (handledChangePassword) return;

  // Then serve static files and homepage
  if (req.method === 'GET' && (req.url === '/' || req.url === '/home')) {
    const filePath = path.join(__dirname, '../public/index.html');
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(data);
    } catch {
      res.writeHead(404);
      return res.end('Not Found');
    }
  }

  if (req.method === 'GET') {
    let requestedPath = req.url.split('?')[0]; // Remove query string
    requestedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, ''); // Sanitize

    if (requestedPath === '/') requestedPath = '/index.html'; // fallback to index

    const filePath = path.join(__dirname, '../public', requestedPath);
    const ext = path.extname(filePath);

    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(ext) });
      return res.end(data);
    } catch {
      res.writeHead(404);
      return res.end('Not Found');
    }
  }

  // Fallback 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});