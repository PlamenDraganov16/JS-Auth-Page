const crypto = require('crypto'); // Node.js crypto module for generating secure random bytes

const sessions = {}; // In-memory session store (sessionId -> userData)


// Parse cookies from the raw 'Cookie' header string into an object
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  // Split cookies by ';' and parse each one into key/value pairs
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts[0].trim()] = decodeURIComponent(parts[1]);
  });
  return list;
}

// Retrieve session data based on sessionId stored in request cookies
function getSession(req) {
  const cookies = parseCookies(req.headers.cookie); // Get cookies from request headers
  if (!cookies.sessionId) return null; // no session exists

  // Return session data for this sessionId or null if none found
  return sessions[cookies.sessionId] || null;
}

// Create a new session with unique sessionId and store user data
function setSession(res, userData) {
  const sessionId = crypto.randomBytes(16).toString('hex'); // Generate secure random session ID
  sessions[sessionId] = userData;

  // Set cookie header with sessionId, HttpOnly for security, and Path=/ for site-wide cookie
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
}

// Clear session data for a given request and instruct browser to delete cookie
function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sessionId) {
    delete sessions[cookies.sessionId]; // Remove session data from server store
  }

  // Set cookie with Max-Age=0 to expire it immediately and clear on client side
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
}

module.exports = {
  sessions,
  parseCookies,
  getSession,
  setSession,
  clearSession
};
