require('dotenv').config();

const http = require('http')
const fs = require('fs').promises;
const path = require('path');
const morgan = require('morgan')


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

const server = http.createServer(async (req, res) => {
  let filePath = '';
  let contentType = '';

  if (req.url === '/' || req.url === '/home') {
    filePath = path.join(__dirname, '../public/index.html');
    contentType = 'text/html';
  } else {
    filePath = path.join(__dirname, '../public', req.url);
    contentType = getContentType(path.extname(filePath));
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});







