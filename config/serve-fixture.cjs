// Local browser validation only. Never copy this server or dist-fixture to Pages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');

(async () => {
  const directory = path.resolve(__dirname, '../dist-fixture');
  const client = path.dirname(require.resolve('@signalstickers/stickers-client'));
  const {default: schema} = await import(pathToFileURL(path.join(client, 'etc/stickers-proto.js')));
  const Pack = require('protobufjs').Root.fromJSON(schema).lookupType('Pack');
  const webp = Buffer.from('UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==', 'base64');
  const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'stickerData.json'), 'utf8'));
  const encrypt = (key, plain) => {
    const keys = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(key, 'hex'), Buffer.alloc(32), 'Sticker Pack', 64));
    const iv = Buffer.alloc(16, 7);
    const cipher = crypto.createCipheriv('aes-256-cbc', keys.subarray(0, 32), iv);
    const body = Buffer.concat([iv, cipher.update(plain), cipher.final()]);
    return Buffer.concat([body, crypto.createHmac('sha256', keys.subarray(32)).update(body).digest()]);
  };
  const forceFallback = process.env.FORCE_WEBP_FALLBACK === '1';
  const port = forceFallback ? 8089 : 8088;
  const origin = `http://127.0.0.1:${port}`;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, origin);
    if (url.pathname === '/fixture/ping') {res.writeHead(204).end(); return;}
    const match = url.pathname.match(/^\/stickers\/([123]{32})\/(manifest\.proto|full\/\d+)$/);
    if (match) {
      const pack = catalog.find(item => item.meta.id === match[1]) ||
        (match[1] === '3'.repeat(32) ? {meta: {key: '3'.repeat(64)}, manifest: {title: 'Unlisted fixture', author: 'Offline test', cover: {id: 0, emoji: '🐈'}}} : undefined);
      if (!pack) {res.writeHead(404).end(); return;}
      const manifest = {...pack.manifest, stickers: [{id: 0, emoji: '🐈'}]};
      const plain = match[2] === 'manifest.proto' ? Pack.encode(Pack.create(manifest)).finish() : webp;
      res.writeHead(200, {'Content-Type': 'application/octet-stream'}).end(encrypt(pack.meta.key, plain));
      return;
    }
    let target = path.resolve(directory, `.${decodeURIComponent(url.pathname)}`);
    if (target !== directory && !target.startsWith(`${directory}${path.sep}`)) {res.writeHead(403).end(); return;}
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) target = path.join(directory, 'index.html');
    const ext = path.extname(target);
    const mime = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'};
    let body = fs.readFileSync(target);
    if (ext === '.js' || ext === '.html') {
      body = body.toString().replaceAll('https://cdn-ca.signal.org', origin).replaceAll('https://ping.signalstickers.com/ping', `${origin}/fixture/ping`);
    }
    if (ext === '.html' && forceFallback) {
      // Only fail WebP Hero's two feature probes. The unchanged app must then
      // load its decoder chunks and render the fixture as a PNG.
      const probeOne = `data:image/webp;base64,${webp.toString('base64')}`;
      const probeTwo = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA=';
      body = body.replace('<head>', `<head><script>
        const createElement = document.createElement.bind(document);
        const imageSource = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        document.createElement = function(tag, ...args) {
          const element = createElement(tag, ...args);
          if (tag === 'img') Object.defineProperty(element, 'src', {
            get() {return imageSource.get.call(this);},
            set(value) {
              if ([${JSON.stringify(probeOne)}, ${JSON.stringify(probeTwo)}].includes(value))
                queueMicrotask(() => this.onerror && this.onerror(new Event('error')));
              else imageSource.set.call(this, value);
            }
          });
          return element;
        };
      </script>`);
    }
    res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store'}).end(body);
  });
  server.listen(port, '127.0.0.1', () => console.log(`Fixture gallery: ${origin}`));
})();
