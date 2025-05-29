const crypto = require('crypto');

const sessions = {};

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
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
}

function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sessionId) {
    delete sessions[cookies.sessionId];
  }
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
}

module.exports = {
  sessions,
  parseCookies,
  getSession,
  setSession,
  clearSession
};
