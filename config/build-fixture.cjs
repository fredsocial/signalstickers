// Exercise the real catalog plugin from cached synthetic manifests, offline.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const packs = yaml.safeLoad(fs.readFileSync(path.join(root, 'tests/fixtures/stickers.yml'), 'utf8'));
const cache = path.join(root, '.sticker-pack-cache');
fs.mkdirSync(cache, {recursive: true});
for (const [id, meta] of Object.entries(packs)) {
  fs.writeFileSync(path.join(cache, `${id}.json`), JSON.stringify({
    meta: {...meta, id},
    manifest: {title: meta.nsfw ? 'Fixture restricted pack' : 'Fixture cats', author: 'Offline test', cover: {id: 0, emoji: '🐈'}}
  }));
}
const result = spawnSync(process.execPath, [
  '--require', path.join(__dirname, 'deny-network.cjs'),
  require.resolve('webpack-cli/bin/cli.js'), '--mode=production',
  '--config=config/webpack.config.babel.ts', '--env', 'fixture=true'
], {cwd: root, stdio: 'inherit'});
if (result.status !== 0) process.exit(result.status || 1);
const assert = require('node:assert/strict');
// Webpack already supplies Acorn; check every emitted script, including lazy
// decoder chunks, so modern dependency syntax cannot break older browsers.
const acorn = require('acorn');
for (const file of fs.readdirSync(path.join(root, 'dist-fixture'))) {
  if (file.endsWith('.js')) {
    try {
      acorn.parse(fs.readFileSync(path.join(root, 'dist-fixture', file), 'utf8'), {ecmaVersion: 2019, sourceType: 'script'});
    } catch (error) {
      throw new Error(`Browser syntax regression in ${file}: ${error.message}`);
    }
  }
}
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'dist-fixture/stickerData.json'), 'utf8'));
assert.deepEqual(catalog.map(pack => pack.meta.id), Object.keys(packs).reverse());
assert.equal(catalog[1].manifest.title, 'Fixture cats');
const html = fs.readFileSync(path.join(root, 'dist-fixture/index.html'), 'utf8');
assert.match(html, /rel=(?:"preload"|preload)[^>]*home-/);
assert.ok(!html.includes('href="autohome-'));
console.log('Offline production build: ES2019 scripts, catalog order, metadata and home preloads passed.');
