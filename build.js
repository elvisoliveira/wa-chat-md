// npm run build | npm run watch — src/ → dist/, the folder to "Load unpacked".
// Bundles the scripts (content scripts can't import), copies the static files,
// renders the icon PNGs.
// ponytail: magic-regexp ships in the bundle (~3.5 KB). Its build-time
// transform needs acorn wired into unplugin's esbuild adapter; add that only if
// the size ever matters.

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import * as esbuild from 'esbuild';

const options = {
  entryPoints: ['src/content.js', 'src/popup.js', 'src/popup.html', 'src/manifest.json'],
  outdir: 'dist',
  bundle: true,
  loader: { '.html': 'copy', '.json': 'copy' },
  logLevel: 'info',
};

// Chrome takes no SVG icons. ponytail: rsvg-convert from librsvg; swap for
// @resvg/resvg-js if this has to build where librsvg isn't installed.
mkdirSync('dist/icons', { recursive: true });
for (const size of ['16', '32', '48', '128']) {
  execFileSync('rsvg-convert', ['-w', size, '-h', size, 'src/icon.svg', '-o', `dist/icons/${size}.png`]);
}

if (process.argv.includes('--watch')) await (await esbuild.context(options)).watch();
else await esbuild.build(options);
