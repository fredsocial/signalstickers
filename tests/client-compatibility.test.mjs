import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createCipheriv, createHmac, hkdfSync, webcrypto} from 'node:crypto';
import queryString from 'query-string';
import protobuf from 'protobufjs';

const require = createRequire(import.meta.url);
const clientEntry = require.resolve('@signalstickers/stickers-client');
const clientDirectory = path.dirname(clientEntry);
const clientRequire = createRequire(pathToFileURL(clientEntry));
const {default: axios} = await import(pathToFileURL(path.join(path.dirname(clientRequire.resolve('axios/package.json')), 'index.js')));
const {default: schema} = await import(pathToFileURL(path.join(clientDirectory, 'etc/stickers-proto.js')));
const Pack = protobuf.Root.fromJSON(schema).lookupType('Pack');
// Synthetic fixture key, never a credential or real sticker pack.
let responseMode = 'browser';
const key = '11'.repeat(32);
const image = Buffer.from('524946460400000057454250', 'hex');
const encrypted = bytes => {
  const keys = Buffer.from(hkdfSync('sha256', Buffer.from(key, 'hex'), Buffer.alloc(32), 'Sticker Pack', 64));
  const iv = Buffer.alloc(16, 7);
  const cipher = createCipheriv('aes-256-cbc', keys.subarray(0, 32), iv);
  const body = Buffer.concat([iv, cipher.update(bytes), cipher.final()]);
  return Buffer.concat([body, createHmac('sha256', keys.subarray(32)).update(body).digest()]);
};
const manifest = encrypted(Pack.encode(Pack.create({title: 'Offline cats', author: 'Fixture', cover: {id: 0, emoji: '🐈'}, stickers: [{id: 0, emoji: '🐈'}]})).finish());
axios.defaults.adapter = async config => {
  let data = config.url.includes('/full/') ? encrypted(image) : Buffer.from(manifest);
  if (config.url.includes('/tampered/')) data[data.length - 1] ^= 1;
  if (config.url.includes('/malformed/')) data = encrypted(Buffer.from([0xff, 0xff]));
  return {data: responseMode === 'node' ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), status: 200, statusText: 'OK', headers: {}, config};
};
globalThis.window = {crypto: webcrypto};
const browser = await import(pathToFileURL(path.join(clientDirectory, 'browser.js')));
const node = await import(pathToFileURL(clientEntry));

for (const [name, client] of [['browser', browser], ['node', node]]) {
  test(`${name}: authenticated manifest, image and emoji APIs remain compatible`, async () => {
    responseMode = name;
    const pack = await client.getStickerPackManifest(`valid-${name}`, key);
    assert.equal(pack.title, 'Offline cats');
    assert.equal(pack.cover.id, 0);
    assert.equal(await client.getEmojiForSticker(`valid-${name}`, key, 0), '🐈');
    assert.deepEqual(Buffer.from(await client.getStickerInPack(`valid-${name}`, key, 0)), image);
  });
  test(`${name}: rejects a modified MAC and invalid decrypted protobuf`, async () => {
    responseMode = name;
    await assert.rejects(client.getStickerPackManifest('tampered', key), /MAC/);
    await assert.rejects(client.getStickerPackManifest('malformed', key));
  });
}

test('query parsing preserves search/filter values, Signal keys and malformed input handling', () => {
  const parsed = queryString.parse('?search=cat%20%F0%9F%90%88&nsfw=true&original=true');
  assert.deepEqual({...parsed}, {nsfw: 'true', original: 'true', search: 'cat 🐈'});
  const url = queryString.stringifyUrl({url: '/pack/fixture', query: {key, search: 'cat 🐈'}});
  assert.equal(queryString.parseUrl(url).query.key, key);
  assert.equal(queryString.parseUrl(url).query.search, 'cat 🐈');
  assert.doesNotThrow(() => queryString.parse('?search=%E0%A4%A%ZZ'));
});
