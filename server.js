const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'members.json');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-now';
const SESSION_TTL = 8 * 60 * 60 * 1000;
const sessions = new Map();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));

function readMembers() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeMembers(members) {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(members, null, 2));
  fs.renameSync(temp, DATA_FILE);
}
function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(payload);
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(pair => {
    const i = pair.indexOf('=');
    return [pair.slice(0, i).trim(), decodeURIComponent(pair.slice(i + 1).trim())];
  }));
}
function isAuthenticated(req) {
  const token = parseCookies(req).nn_session;
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return false; }
  session.expires = Date.now() + SESSION_TTL;
  return true;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function cleanMember(input) {
  return {
    id: String(input.id || crypto.randomUUID()),
    name: String(input.name || '').trim(),
    role: String(input.role || 'Class Representative').trim(),
    cls: String(input.cls || '').trim().toUpperCase(),
    type: input.type === 'leadership' ? 'leadership' : 'representative',
    photo: input.photo ? String(input.photo).trim() : null,
    jobs: Array.isArray(input.jobs) ? input.jobs.map(String).map(s => s.trim()).filter(Boolean).slice(0, 8) : [],
    bio: String(input.bio || '').trim(),
    email: input.email ? String(input.email).trim() : ''
  };
}
function validateMember(member) {
  if (!member.cls || !/^\d{1,2}[A-Z]$/.test(member.cls)) return 'Class must look like 10A or 12B.';
  if (!member.bio) return 'About text is required.';
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) return 'Email address is invalid.';
  return null;
}
function contentType(file) {
  return { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
function serveStatic(req, res) {
  let requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  if (requested === '/') requested = '/index.html';
  if (requested === '/admin') requested = '/admin.html';
  const file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(path.resolve(ROOT)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=86400' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/members') return send(res, 200, readMembers(), { 'Cache-Control': 'no-cache' });
    if (req.method === 'GET' && url.pathname === '/api/session') return send(res, 200, { authenticated: isAuthenticated(req) });
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(req);
      if (!body.password || body.password !== ADMIN_PASSWORD) return send(res, 401, { error: 'Incorrect password.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { expires: Date.now() + SESSION_TTL });
      return send(res, 200, { ok: true }, { 'Set-Cookie': `nn_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}` });
    }
    if (req.method === 'POST' && url.pathname === '/api/logout') {
      const token = parseCookies(req).nn_session; if (token) sessions.delete(token);
      return send(res, 200, { ok: true }, { 'Set-Cookie': 'nn_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!isAuthenticated(req)) return send(res, 401, { error: 'Admin login required.' });
      let members = readMembers();
      if (req.method === 'POST' && url.pathname === '/api/admin/members') {
        const member = cleanMember(await readBody(req)); const error = validateMember(member);
        if (error) return send(res, 400, { error });
        members.push(member); writeMembers(members); return send(res, 201, member);
      }
      const match = url.pathname.match(/^\/api\/admin\/members\/([^/]+)$/);
      if (match) {
        const index = members.findIndex(m => m.id === decodeURIComponent(match[1]));
        if (index < 0) return send(res, 404, { error: 'Member not found.' });
        if (req.method === 'PUT') {
          const member = cleanMember({ ...members[index], ...(await readBody(req)), id: members[index].id }); const error = validateMember(member);
          if (error) return send(res, 400, { error });
          members[index] = member; writeMembers(members); return send(res, 200, member);
        }
        if (req.method === 'DELETE') { members.splice(index, 1); writeMembers(members); return send(res, 204, ''); }
      }
    }
    if (req.method === 'GET') return serveStatic(req, res);
    send(res, 405, { error: 'Method not allowed.' });
  } catch (error) { console.error(error); send(res, 500, { error: 'Server error.' }); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`NN Student Council server running at http://localhost:${PORT}`));
