import { basename, resolve } from 'path';
import express from './framework.js';

export function createServer(base, overlayPaths = []) {
  const app = express();

  const absBase = resolve(base);
  const overlays = overlayPaths.map(p => ({
    mountPath: '/' + basename(resolve(p)),
    diskPath:  resolve(p),
  }));

  // CORS headers for every response
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    next();
  });

  // /_mounts — lets SPAs discover what's layered
  app.get('/_mounts', (_req, res) => {
    res.json({
      base: absBase,
      overlays: overlays.map(o => ({ mountPath: o.mountPath, diskPath: o.diskPath })),
    });
  });

  // Overlays are registered first so they shadow the base at their mount path.
  // The static middleware calls next() when a file isn't found, so the base
  // layer below acts as a transparent fallback — union-mount semantics.
  for (const overlay of overlays) {
    app.use(overlay.mountPath, express.static(overlay.diskPath));
  }

  // Base serves everything else (and fills in files the overlay doesn't have)
  app.use('/', express.static(absBase));

  return app;
}

export function listen(app, port = 8080) {
  return new Promise((resolve, reject) => {
    const srv = app.listen(port, () => {
      const addr = srv.address();
      resolve({
        server: srv,
        port:   addr.port,
        url:    `http://localhost:${addr.port}`,
        close:  () => new Promise((res, rej) => srv.close(err => err ? rej(err) : res())),
      });
    });
    srv.on('error', reject);
  });
}
