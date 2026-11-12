const http = require('http');
const fs = require('fs');
const path = require('path');
const { getInstagramFeed } = require('./lib/instagram');

const PORT = process.env.PORT || 4000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
};

function resolveFilePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]);
  const cleanRel = safePath.replace(/^\/+/, '');

  if (!cleanRel || cleanRel === '') {
    return path.join(ROOT, 'index.html');
  }

  const exactPath = path.join(ROOT, cleanRel);
  if (!exactPath.startsWith(ROOT)) {
    return null;
  }

  if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
    return exactPath;
  }

  const htmlCandidate = `${exactPath}.html`;
  if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
    return htmlCandidate;
  }

  const indexCandidate = path.join(exactPath, 'index.html');
  if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
    return indexCandidate;
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const pathname = rawUrl.split('?')[0];

  if (pathname === '/api/instagram') {
    try {
      const forceRefresh = rawUrl.includes('refresh=1');
      const payload = await getInstagramFeed({ forceRefresh });
      const body = JSON.stringify(payload);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const filePath = resolveFilePath(rawUrl);

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    const is404Page = path.basename(filePath) === '404.html' || filePath.includes(`${path.sep}404${path.sep}`);
    res.writeHead(is404Page ? 404 : 200, {
      'Content-Type': contentType,
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Fallback to 404.html for any non-existent route
  const notFoundPath = path.join(ROOT, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Wagging With GG server running at http://localhost:${PORT}`);
});
