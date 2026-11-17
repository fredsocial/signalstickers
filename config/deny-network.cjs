// A cache miss must fail validation instead of contacting Signal or analytics.
const deny = () => { throw new Error('Network access is forbidden in fixture builds'); };
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = deny;
  transport.get = deny;
}
globalThis.fetch = deny;
