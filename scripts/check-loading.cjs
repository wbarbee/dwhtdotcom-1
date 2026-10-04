// Run with: node scripts/check-loading.cjs
// Exercise the real route/client fetch code without waiting on ESPN or real deadlines.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8').replaceAll('"@/', `"${root}/`);
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { NextRequest } = require('next/server');
const { GET } = require('../app/api/schedule/route.ts');
const { fetchUpcomingSchedule } = require('../hooks/fetchGameData.ts');
const originalFetch = global.fetch;
const originalTimeout = global.setTimeout;
const originalAbortTimeout = AbortSignal.timeout;
const unhandled = [];
process.on('unhandledRejection', error => unhandled.push(error));

const regular = { team: { recordSummary: '1-0' }, events: [
  { id: '1', date: '2026-09-01', seasonType: { type: 2 } },
] };
const postseason = { team: {}, events: [
  { id: '2', date: '2026-12-20', seasonType: { type: 3 } },
  { id: '1', date: '2026-09-01', seasonType: { type: 3 } },
] };
const response = data => Response.json(data);
const stalled = signal => new Promise((_, reject) => {
  signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});
const request = () => new NextRequest('http://localhost/api/schedule?season=2026');

(async () => {
  const pending = [];
  global.fetch = (url, options) => new Promise(resolve => pending.push({ url, options, resolve }));
  const result = GET(request());
  assert.equal(pending.length, 2, 'both ESPN calls start before either completes');
  assert(pending.every(call => call.options.signal instanceof AbortSignal));
  pending.find(call => call.url.includes('seasontype=3')).resolve(response(postseason));
  pending.find(call => call.url.includes('seasontype=2')).resolve(response(regular));
  const combined = await result;
  assert.match(combined.headers.get('Cache-Control'), /s-maxage=60/);
  const data = await combined.json();
  assert.deepEqual(data.events.map(event => [event.id, event.seasonPhase]), [
    ['1', 'regular'], ['2', 'postseason'],
  ], 'merge keeps postseason, chronology, and regular-season collision precedence');

  AbortSignal.timeout = milliseconds => {
    assert.equal(milliseconds, 5000, 'upstream deadline');
    return originalAbortTimeout(20);
  };
  global.fetch = (url, options) => url.includes('seasontype=3')
    ? stalled(options.signal) : Promise.resolve(response(regular));
  // AbortSignal.timeout is unref'ed in Node; keep this standalone check alive.
  const keepAlive = originalTimeout(() => {}, 1000);
  const partial = await GET(request());
  assert.equal(partial.status, 200);
  assert.equal((await partial.json()).events.length, 1, 'postseason timeout preserves regular games');
  global.fetch = (_, options) => stalled(options.signal);
  const failed = await GET(request());
  assert.equal(failed.status, 502);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  clearTimeout(keepAlive);

  let clientCalls = 0;
  global.setTimeout = (callback, milliseconds, ...args) => {
    assert.equal(milliseconds, 10000, 'browser deadline');
    return originalTimeout(callback, 20, ...args);
  };
  global.fetch = (_, options) => { clientCalls++; return stalled(options.signal); };
  const failures = await Promise.allSettled([fetchUpcomingSchedule(), fetchUpcomingSchedule()]);
  assert(failures.every(item => item.status === 'rejected'));
  assert.equal(clientCalls, 1, 'concurrent client requests share one fetch');
  global.fetch = () => { clientCalls++; return Promise.resolve(response({events:[]})); };
  assert.deepEqual(await fetchUpcomingSchedule(), [], 'retry recovers after timeout');
  assert.equal(clientCalls, 2, 'timed-out request was removed from the inflight cache');
  global.fetch = () => Promise.resolve(new Response('', {status:502}));
  await assert.rejects(fetchUpcomingSchedule(), /Failed to fetch game data/);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(unhandled, [], 'cleanup must not create a detached rejection');
  console.log('PASS: concurrent schedules, postseason fallback, bounded failures, client deduplication, retry, and rejection cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.fetch = originalFetch;
  global.setTimeout = originalTimeout;
  AbortSignal.timeout = originalAbortTimeout;
});
