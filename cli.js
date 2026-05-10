#!/usr/bin/env node
import { resolve, basename } from 'path';
import { createServer, listen } from './src/application.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { port: 8080, open: false, https: false };
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if      (a === '-p' || a === '--port')  { opts.port = Number(args[++i]); }
    else if (a.startsWith('--port='))        { opts.port = Number(a.slice(7)); }
    else if (a === '-o' || a === '--open')   { opts.open = true; }
    else if (a === '-s' || a === '--https')  { opts.https = true; }
    else if (!a.startsWith('-'))             { positional.push(a); }
    else {
      console.error(`Unknown option: ${a}`);
      process.exit(1);
    }
  }

  if (positional.length === 0) {
    console.error('Usage: shocking [options] <base-dir> [overlay-dir...]\n');
    console.error('  -p, --port <n>   port (default: 8080)');
    console.error('  -o, --open       open browser on start');
    console.error('  -s, --https      enable HTTPS (coming soon)');
    process.exit(1);
  }

  return {
    base:     resolve(positional[0]),
    overlays: positional.slice(1).map(p => resolve(p)),
    opts,
  };
}

const { base, overlays, opts } = parseArgs(process.argv);
const app = createServer(base, overlays);
const { url } = await listen(app, opts.port);

const pad = 12;
console.log(`\n  shocking  →  ${url}`);
console.log(`  ${'/' .padEnd(pad)}→  ${base}`);
for (const o of overlays) {
  const mp = '/' + basename(o);
  console.log(`  ${mp.padEnd(pad)}→  ${o}`);
}
console.log();

if (opts.open) {
  const { exec } = await import('child_process');
  exec(`xdg-open "${url}" 2>/dev/null || open "${url}" 2>/dev/null`);
}
