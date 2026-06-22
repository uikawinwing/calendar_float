import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, get as httpGet } from 'node:http';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const host = process.env.CALENDAR_FLOAT_DEV_HOST || '127.0.0.1';
const port = Number(process.env.CALENDAR_FLOAT_DEV_PORT || 5500);
const probePath = '/dist/calendar-float/index.js';
const probeUrl = `http://${host}:${port}${probePath}`;

const mimeTypes = new Map([
  ['.css', 'text/css; charset=UTF-8'],
  ['.html', 'text/html; charset=UTF-8'],
  ['.js', 'application/javascript; charset=UTF-8'],
  ['.json', 'application/json; charset=UTF-8'],
  ['.map', 'application/json; charset=UTF-8'],
  ['.svg', 'image/svg+xml; charset=UTF-8'],
  ['.txt', 'text/plain; charset=UTF-8'],
]);

function isPathInsideRoot(filePath) {
  const rel = relative(root, filePath);
  return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${sep}`));
}

function probeExistingServer() {
  return new Promise(resolveProbe => {
    const request = httpGet(probeUrl, response => {
      response.resume();
      resolveProbe({ reachable: true, statusCode: response.statusCode ?? 0 });
    });
    request.setTimeout(1200, () => {
      request.destroy(new Error('timeout'));
    });
    request.on('error', error => {
      resolveProbe({ reachable: false, error });
    });
  });
}

function serveFile(request, response) {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const target = normalize(join(root, pathname === '/' ? 'index.html' : pathname));

  if (!isPathInsideRoot(target)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    response.end('Forbidden');
    return;
  }

  if (!existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': mimeTypes.get(extname(target).toLowerCase()) || 'application/octet-stream',
  });
  createReadStream(target).pipe(response);
}

async function main() {
  const existing = await probeExistingServer();
  if (existing.reachable) {
    if (existing.statusCode === 200) {
      console.log(`[calendar-float] dev server already running: ${probeUrl}`);
      return;
    }
    console.error(
      `[calendar-float] port ${port} is in use, but ${probePath} returned HTTP ${existing.statusCode}.`,
    );
    console.error('[calendar-float] Not starting another server. Check the existing process or server root.');
    process.exitCode = 1;
    return;
  }

  const server = createServer(serveFile);
  server.on('error', async error => {
    if (error?.code !== 'EADDRINUSE') {
      console.error(`[calendar-float] failed to start dev server: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    const retry = await probeExistingServer();
    if (retry.reachable && retry.statusCode === 200) {
      console.log(`[calendar-float] dev server already running: ${probeUrl}`);
      return;
    }
    console.error(`[calendar-float] port ${port} is occupied, and ${probePath} is not available.`);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`[calendar-float] serving ${root}`);
    console.log(`[calendar-float] ${probeUrl}`);
    console.log('[calendar-float] keep this terminal open; Ctrl+C stops the server');
  });
}

void main();
