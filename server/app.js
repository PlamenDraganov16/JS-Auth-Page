require('dotenv').config();
const http = require('http'); // Native HTTP module to create server
const fs = require('fs').promises; // File system promises API for async file handling
const path = require('path');  // Utilities for handling file and directory paths

const { getSession } = require('./utils/sessionUtils');

// Import route handlers for authentication and user-related APIs
const { handleRegister, handleLogin, handleLogout, } = require('./routes/auth');
const { handleGetProfile, handleUpdateProfile, handleChangePassword } = require('./routes/user');

const PORT = process.env.PORT || 3000;


// Function to return correct Content-Type header based on file extension
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
    default: return 'application/octet-stream'; // default binary stream
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

  // Handle API routes first - if any handler processes request, return immediately
  if (await handleRegister(req, res)) return;
  if (await handleLogin(req, res)) return;
  if (await handleLogout(req, res)) return;
  if (await handleGetProfile(req, res)) return;
  if (await handleUpdateProfile(req, res)) return;
  if (await handleChangePassword(req, res)) return;

  // Serve homepage on root or /home requests
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

  // Serve static files for other GET requests
  if (req.method === 'GET') {
    let requestedPath = req.url.split('?')[0];
    requestedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');
    // Remove query parameters and normalize path to prevent directory traversal attacks
    if (requestedPath === '/') requestedPath = '/index.html';

    const filePath = path.join(__dirname, '../public', requestedPath);
    const ext = path.extname(filePath);

    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(ext) });
      return res.end(data);
    } catch {
      // For any other requests not handled above, return 404
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
