// Copies the website's paint app into www/ for Capacitor, adapted for the stores:
// - adds the purchase bridge before the app script
// - no service worker (the app ships its files), no external website link (kids category rule)
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..'), site = join(app, '..'), www = join(app, 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'assets', 'img'), { recursive: true });
// paint/videos/ stays on the website: the app streams Mia's videos from there, so the download stays small
cpSync(join(site, 'paint'), join(www, 'paint'), { recursive: true, filter: src => !src.includes(join('paint', 'videos')) });
cpSync(join(site, 'assets', 'fonts'), join(www, 'assets', 'fonts'), { recursive: true });
for (const f of ['icon.webp', 'logo.webp', 'icon-32.png']) {
  const src = join(site, 'assets', 'img', f);
  if (existsSync(src)) cpSync(src, join(www, 'assets', 'img', f));
}
rmSync(join(www, 'paint', 'sw.js'), { force: true });
cpSync(join(app, 'src', 'store-bridge.js'), join(www, 'paint', 'store-bridge.js'));

const p = join(www, 'paint', 'index.html');
let html = readFileSync(p, 'utf8');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('build-web: not found: ' + from.slice(0, 60)); html = html.replace(from, to); };
swap('<script>', '<script src="store-bridge.js"></script>\n<script>');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
html = html.replace(/<a href="https:\/\/www\.lookandseecolorme\.com"[^>]*>([^<]*)<\/a>/, '<span>$1</span>');
writeFileSync(p, html);
writeFileSync(join(www, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=paint/index.html"><script>location.replace("paint/index.html")</script>');
console.log('www/ ready');
