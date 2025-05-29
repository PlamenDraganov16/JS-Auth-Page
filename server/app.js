require('dotenv').config();
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const { getSession } = require('./utils/sessionUtils');

const { handleRegister, handleLogin, handleLogout, } = require('./routes/auth');
const { handleGetProfile, handleUpdateProfile, handleChangePassword } = require('./routes/user');

const PORT = process.env.PORT || 3000;

const getContentType = (ext) => {
  switch (ext) {
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.html': return 'text/html';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.ico': return 'image/x-icon';
    case '.svg': return 'image/svg+xml';
    case '.woff2': return 'font/woff2';
    case '.woff': return 'font/woff';
    case '.ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
};

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
  if (await handleRegister(req, res)) return;
  if (await handleLogin(req, res)) return;
  if (await handleLogout(req, res)) return;
  if (await handleGetProfile(req, res)) return;
  if (await handleUpdateProfile(req, res)) return;
  if (await handleChangePassword(req, res)) return;

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
    let requestedPath = req.url.split('?')[0];
    requestedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');

    if (requestedPath === '/') requestedPath = '/index.html';

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

module.exports = server;
